import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { TrelloBoardService } from '../trello-board/trello-board.service';
import { UserType } from '../user/types/user';
import { ProjectStatus } from './types/project';
import { TrelloBoardDocument } from '../trello-board/schemas/trello-board.schema';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    private userService: UserService,
    private mailService: MailService,
    private trelloBoardService: TrelloBoardService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectDocument> {
    try {
      console.log('Attempting to create project with userId:', userId); // Debug log
      // Verify user is CEO or Manager
      const user = await this.userService.findById(userId);
      console.log('User found:', user); // Debug log
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        console.error('Unauthorized user type:', user?.type);
        throw new UnauthorizedException('Only CEO or Manager can create projects');
      }

      // Validate projectManager if provided
      // if (createProjectDto.projectManager) {
      //   const manager = await this.userService.findById(createProjectDto.projectManager);
      //   // if (!manager) {
      //   //   throw new BadRequestException('Invalid project manager ID');
      //   // }
      // }

      // Create project
      const createdProject = new this.projectModel({
        ...createProjectDto,
        createdBy: new Types.ObjectId(userId),
        status: ProjectStatus.ToDo,
        frontendDevs: createProjectDto.frontendDevs.map(id => new Types.ObjectId(id)), // Convert strings to ObjectIds
        backendDevs: createProjectDto.backendDevs.map(id => new Types.ObjectId(id)), // Convert strings to ObjectIds
      });

      // Save project to get its ID
      const savedProject = await createdProject.save();

      // Create Trello board with the same name
      const trelloBoard: TrelloBoardDocument = await this.trelloBoardService.create(savedProject.name, userId);

      // Collect all member IDs (creator, project manager, frontend devs, backend devs)
      const memberIds: string[] = [userId];
      if (createProjectDto.projectManager) {
        memberIds.push(createProjectDto.projectManager);
      }
      memberIds.push(...createProjectDto.frontendDevs);
      memberIds.push(...createProjectDto.backendDevs);

      // Add unique members to the Trello board
      const uniqueMemberIds = [...new Set(memberIds)];
      if (uniqueMemberIds.length > 0) {
        await this.trelloBoardService.addUsers(trelloBoard.id.toString(), uniqueMemberIds, userId);
      }

      // Update project with Trello board ID
      savedProject.trelloBoardId = trelloBoard.id; // Direct assignment since _id is Types.ObjectId
      await savedProject.save();

      return savedProject;
    } catch (err) {
      console.error('Error creating project:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }

  async findAll(): Promise<ProjectDocument[]> {
    try {
      return await this.projectModel
        .find()
        .populate('createdBy', 'name email')
        .populate('projectManager', 'name email')
        .populate('frontendDevs', 'name email')
        .populate('backendDevs', 'name email')
        .populate('trelloBoardId', 'name') // Populate trelloBoardId
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findById(id: string): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel
        .findById(id)
        .populate('createdBy', 'name email')
        .populate('projectManager', 'name email')
        .populate('frontendDevs', 'name email')
        .populate('backendDevs', 'name email')
        .populate('trelloBoardId', 'name') // Populate trelloBoardId
        .exec();
      if (!project) {
        throw new BadRequestException('Project not found');
      }
      return project;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findMyProjects(userId: string): Promise<ProjectDocument[]> {
    try {
      return await this.projectModel
        .find({
          $or: [
            { createdBy: new Types.ObjectId(userId) },
            { projectManager: new Types.ObjectId(userId) },
            { frontendDevs: new Types.ObjectId(userId) },
            { backendDevs: new Types.ObjectId(userId) },
          ],
        })
        .populate('createdBy', 'name email')
        .populate('projectManager', 'name email')
        .populate('frontendDevs', 'name email')
        .populate('backendDevs', 'name email')
        .populate('trelloBoardId', 'name') // Populate trelloBoardId
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateProject(id: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new BadRequestException('Project not found');
      }
      // Validate status if provided
      if (dto.status && !Object.values(ProjectStatus).includes(dto.status)) {
        throw new BadRequestException('Invalid status value');
      }
      // Only assign fields that are defined in dto
      Object.keys(dto).forEach((key) => {
        if (dto[key] !== undefined) {
          project[key] = dto[key];
        }
      });
      return await project.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    try {
      const project = await this.projectModel.findByIdAndDelete(id);
      if (!project) {
        throw new BadRequestException('Project not found');
      }
      return { message: 'Project deleted successfully' };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async addMembers(id: string, dto: AddMemberDto, actorId: string): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      // Get the user who is performing the action
      const actor = await this.userService.findById(actorId);
      if (!actor) {
        throw new BadRequestException('Invalid actor ID');
      }

      // Validate frontendDevs if provided
      if (dto.frontendDevs?.length) {
        const uniqueFrontendDevs = new Set(dto.frontendDevs);
        if (uniqueFrontendDevs.size !== dto.frontendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in frontendDevs');
        }
        const frontendUsers = await this.userService.findByIds(dto.frontendDevs);
        if (frontendUsers.length !== dto.frontendDevs.length) {
          throw new BadRequestException('Invalid frontend developer IDs');
        }
        // Add new frontend devs, avoiding duplicates
        const existingFrontendDevs = new Set(project.frontendDevs.map(id => id.toString()));
        const newFrontendDevs = dto.frontendDevs.filter(id => !existingFrontendDevs.has(id));
        project.frontendDevs = [...project.frontendDevs, ...newFrontendDevs.map(id => new Types.ObjectId(id))];
        
        // Send email to each new frontend developer
        for (const user of frontendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Added to Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been added to the project "${project.name}" as a frontend developer by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
        // Add new frontend devs to Trello board
        if (newFrontendDevs.length > 0 && project.trelloBoardId) {
          await this.trelloBoardService.addUsers(project.trelloBoardId.toString(), newFrontendDevs, actorId);
        }
      }

      // Validate backendDevs if provided
      if (dto.backendDevs?.length) {
        const uniqueBackendDevs = new Set(dto.backendDevs);
        if (uniqueBackendDevs.size !== dto.backendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in backendDevs');
        }
        const backendUsers = await this.userService.findByIds(dto.backendDevs);
        if (backendUsers.length !== dto.backendDevs.length) {
          throw new BadRequestException('Invalid backend developer IDs');
        }
        // Add new backend devs, avoiding duplicates
        const existingBackendDevs = new Set(project.backendDevs.map(id => id.toString()));
        const newBackendDevs = dto.backendDevs.filter(id => !existingBackendDevs.has(id));
        project.backendDevs = [...project.backendDevs, ...newBackendDevs.map(id => new Types.ObjectId(id))];

        // Send email to each new backend developer
        for (const user of backendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Added to Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been added to the project "${project.name}" as a backend developer by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
        // Add new backend devs to Trello board
        if (newBackendDevs.length > 0 && project.trelloBoardId) {
          await this.trelloBoardService.addUsers(project.trelloBoardId.toString(), newBackendDevs, actorId);
        }
      }

      return await project.save();
    } catch (err) {
      console.error('Error adding members to project:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }

  async removeMembers(id: string, dto: RemoveMemberDto, actorId: string): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      // Get the user who is performing the action
      const actor = await this.userService.findById(actorId);
      if (!actor) {
        throw new BadRequestException('Invalid actor ID');
      }

      // Validate and remove frontendDevs if provided
      if (dto.frontendDevs && dto.frontendDevs.length > 0) {
        const uniqueFrontendDevs = new Set(dto.frontendDevs);
        if (uniqueFrontendDevs.size !== dto.frontendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in frontendDevs');
        }
        const frontendUsers = await this.userService.findByIds(dto.frontendDevs);
        if (frontendUsers.length !== dto.frontendDevs.length) {
          throw new BadRequestException('Invalid frontend developer IDs');
        }
        project.frontendDevs = project.frontendDevs.filter(
          id => !dto.frontendDevs!.includes(id.toString())
        );
       
        // Send email to each removed frontend developer
        for (const user of frontendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Removed from Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been removed from the project "${project.name}" by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
      }

      // Validate and remove backendDevs if provided
      if (dto.backendDevs && dto.backendDevs.length > 0) {
        const uniqueBackendDevs = new Set(dto.backendDevs);
        if (uniqueBackendDevs.size !== dto.backendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in backendDevs');
        }
        const backendUsers = await this.userService.findByIds(dto.backendDevs);
        if (backendUsers.length !== dto.backendDevs.length) {
          throw new BadRequestException('Invalid backend developer IDs');
        }
        project.backendDevs = project.backendDevs.filter(
          id => !dto.backendDevs!.includes(id.toString())
        );

        // Send email to each removed backend developer
        for (const user of backendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Removed from Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been removed from the project "${project.name}" by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
      }

      return await project.save();
    } catch (err) {
      console.error('Error removing members from project:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }
}