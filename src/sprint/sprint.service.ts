import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sprint, SprintDocument } from './schemas/sprint.schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UserService } from '../user/user.service';
import { ProjectService } from '../project/project.service';
import { UserType } from '../user/types/user';

@Injectable()
export class SprintService {
  constructor(
    @InjectModel(Sprint.name)
    private sprintModel: Model<SprintDocument>,
    private userService: UserService,
    private projectService: ProjectService,
  ) {}

  async create(createSprintDto: CreateSprintDto, userId: string): Promise<SprintDocument> {
    try {
      console.log('Attempting to create sprint with userId:', userId); // Debug log
      // Verify user exists
      const user = await this.userService.findById(userId);
      console.log('User found:', user); // Debug log
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify project exists and get projectManager
      const project = await this.projectService['projectModel'].findById(createSprintDto.projectId);
      console.log('Project found:', project); // Debug log
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      // Check if user is CEO, Manager, or the project's projectManager
      const isProjectManager = project.projectManager?.toString() === userId;
      if (
        ![UserType.CEO, UserType.MANAGER].includes(user.type) &&
        !isProjectManager
      ) {
        throw new UnauthorizedException(
          'Only CEO, Manager, or the project manager can create sprints',
        );
      }

      // Validate endTime is after startTime
      if (new Date(createSprintDto.endTime) <= new Date(createSprintDto.startTime)) {
        throw new BadRequestException('End time must be after start time');
      }

      const createdSprint = new this.sprintModel({
        ...createSprintDto,
        status: 'To Do', // Set default status to "To Do"
        createdBy: userId,
      });
      return await createdSprint.save();
    } catch (err) {
      console.error('Error creating sprint:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }

  async update(id: string, updateSprintDto: UpdateSprintDto, userId: string): Promise<SprintDocument> {
    try {
      console.log('Attempting to update sprint with ID:', id, 'userId:', userId); // Debug log
      // Verify user exists
      const user = await this.userService.findById(userId);
      console.log('User found:', user); // Debug log
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify sprint exists
      const sprint = await this.sprintModel.findById(id);
      if (!sprint) {
        throw new BadRequestException('Sprint not found');
      }

      // Verify project exists and get projectManager
      const project = await this.projectService['projectModel'].findById(sprint.projectId);
      console.log('Project found:', project); // Debug log
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      // Check if user is CEO, Manager, or the project's projectManager
      const isProjectManager = project.projectManager?.toString() === userId;
      if (
        ![UserType.CEO, UserType.MANAGER].includes(user.type) &&
        !isProjectManager
      ) {
        throw new UnauthorizedException(
          'Only CEO, Manager, or the project manager can update sprints',
        );
      }

      // Validate endTime is after startTime if provided
      if (
        updateSprintDto.startTime &&
        updateSprintDto.endTime &&
        new Date(updateSprintDto.endTime) <= new Date(updateSprintDto.startTime)
      ) {
        throw new BadRequestException('End time must be after start time');
      }

      Object.keys(updateSprintDto).forEach((key) => {
        if (updateSprintDto[key] !== undefined) {
          sprint[key] = updateSprintDto[key];
        }
      });

      return await sprint.save();
    } catch (err) {
      console.error('Error updating sprint:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    try {
      console.log('Attempting to delete sprint with ID:', id, 'userId:', userId); // Debug log
      // Verify user exists
      const user = await this.userService.findById(userId);
      console.log('User found:', user); // Debug log
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify sprint exists
      const sprint = await this.sprintModel.findById(id);
      if (!sprint) {
        throw new BadRequestException('Sprint not found');
      }

      // Verify project exists and get projectManager
      const project = await this.projectService['projectModel'].findById(sprint.projectId);
      console.log('Project found:', project); // Debug log
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      // Allow CEO and Manager to delete any sprint; projectManager only for their project's sprints
      const isProjectManager = project.projectManager?.toString() === userId;
      if (
        ![UserType.CEO, UserType.MANAGER].includes(user.type) &&
        !isProjectManager
      ) {
        throw new UnauthorizedException(
          'Only CEO, Manager, or the project manager can delete sprints',
        );
      }

      await this.sprintModel.findByIdAndDelete(id);
      return { message: 'Sprint deleted successfully' };
    } catch (err) {
      console.error('Error deleting sprint:', err); // Debug log
      throw new BadRequestException(err.message);
    }
  }

  async findAllByProject(projectId: string): Promise<SprintDocument[]> {
    try {
      return await this.sprintModel
        .find({ projectId })
        .populate('createdBy', 'name email')
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}