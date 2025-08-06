import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserService } from '../user/user.service';
import { UserType } from '../user/types/user';

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
         
      }

      // Validate frontendDevs if provided
      if (createProjectDto.frontendDevs?.length) {
        const uniqueFrontendDevs = new Set(createProjectDto.frontendDevs);
        if (uniqueFrontendDevs.size !== createProjectDto.frontendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in frontendDevs');
        }
        const frontendUsers = await this.userService.findByIds(createProjectDto.frontendDevs);
        if (frontendUsers.length !== createProjectDto.frontendDevs.length) {
          throw new BadRequestException('Invalid frontend developer IDs');
        }
      }

      // Validate backendDevs if provided
      if (createProjectDto.backendDevs?.length) {
        const uniqueBackendDevs = new Set(createProjectDto.backendDevs);
        if (uniqueBackendDevs.size !== createProjectDto.backendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in backendDevs');
        }
        const backendUsers = await this.userService.findByIds(createProjectDto.backendDevs);
        if (backendUsers.length !== createProjectDto.backendDevs.length) {
          throw new BadRequestException('Invalid backend developer IDs');
        }
      }

      const createdProject = new this.projectModel({
        ...createProjectDto,
        createdBy: userId,
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
            { createdBy: userId },
            { projectManager: userId },
            { frontendDevs: userId },
            { backendDevs: userId },
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
}
