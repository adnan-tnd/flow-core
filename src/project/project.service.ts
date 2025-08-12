import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { UserService } from '../user/user.service';
import { UserType } from '../user/types/user';
import { ProjectStatus } from './types/project';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    private userService: UserService,
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
      if (createProjectDto.projectManager) {
        const manager = await this.userService.findById(createProjectDto.projectManager);
        if (!manager) {
          throw new BadRequestException('Invalid project manager ID');
        }
      }

      

      const createdProject = new this.projectModel({
        ...createProjectDto,
        createdBy: new Types.ObjectId(userId),
        status: ProjectStatus.ToDo, // Default to 'pending'
      });
      return await createdProject.save();
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

  async addMembers(id: string, dto: AddMemberDto): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new BadRequestException('Project not found');
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
      }
      
      return await project.save();
    } catch (err) {
      console.error('Error adding members to project:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }


async removeMembers(id: string, dto: RemoveMemberDto): Promise<ProjectDocument> {
  try {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new BadRequestException('Project not found');
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
    }

    return await project.save();
  } catch (err) {
    console.error('Error removing members from project:', err); // Debug log
    throw new BadRequestException(err.message);
  }
}
}