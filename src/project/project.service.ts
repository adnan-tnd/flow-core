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
import { ListDocument } from '../trello-board/schemas/list.schema';
import { CardDocument } from '../trello-board/schemas/card.schema';
import { UserDocument } from '../user/schemas/user.schema';

// Interface for populated user data
interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

// Interface for populated Trello board data
interface PopulatedTrelloBoard {
  _id: Types.ObjectId;
  name: string;
}

// Interface for the project stats response
export interface ProjectStats {
  projectId: string;
  projectName: string;
  projectManager: { id: string; name: string } | null;
  frontendDevs: { id: string; name: string }[];
  backendDevs: { id: string; name: string }[];
  trelloBoard: { id: string; name: string } | null;
  cardCount: number;
  assignedUsers: { userId: string; name: string; cardCount: number }[];
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    private userService: UserService,
    private mailService: MailService,
    private trelloBoardService: TrelloBoardService,
    @InjectModel('List')
    private listModel: Model<ListDocument>,
    @InjectModel('Card')
    private cardModel: Model<CardDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectDocument> {
    try {
      console.log('Attempting to create project with userId:', userId);
      const user = await this.userService.findById(userId);
      console.log('User found:', user);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        console.error('Unauthorized user type:', user?.type);
        throw new UnauthorizedException('Only CEO or Manager can create projects');
      }

      const createdProject = new this.projectModel({
        ...createProjectDto,
        createdBy: new Types.ObjectId(userId),
        status: ProjectStatus.ToDo,
        frontendDevs: createProjectDto.frontendDevs.map(id => new Types.ObjectId(id)),
        backendDevs: createProjectDto.backendDevs.map(id => new Types.ObjectId(id)),
      });

      const savedProject = await createdProject.save();

      const trelloBoard: TrelloBoardDocument = await this.trelloBoardService.create(savedProject.name, userId);

      const memberIds: string[] = [userId];
      if (createProjectDto.projectManager) {
        memberIds.push(createProjectDto.projectManager);
      }
      memberIds.push(...createProjectDto.frontendDevs);
      memberIds.push(...createProjectDto.backendDevs);

      const uniqueMemberIds = [...new Set(memberIds)];
      if (uniqueMemberIds.length > 0) {
        await this.trelloBoardService.addUsers(trelloBoard.id.toString(), uniqueMemberIds, userId);
      }

      savedProject.trelloBoardId = trelloBoard.id;
      await savedProject.save();

      return savedProject;
    } catch (err) {
      console.error('Error creating project:', err);
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
        .populate('trelloBoardId', 'name')
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
        .populate('trelloBoardId', 'name')
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
        .populate('trelloBoardId', 'name')
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
      if (dto.status && !Object.values(ProjectStatus).includes(dto.status)) {
        throw new BadRequestException('Invalid status value');
      }
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

      const actor = await this.userService.findById(actorId);
      if (!actor) {
        throw new BadRequestException('Invalid actor ID');
      }

      if (dto.frontendDevs?.length) {
        const uniqueFrontendDevs = new Set(dto.frontendDevs);
        if (uniqueFrontendDevs.size !== dto.frontendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in frontendDevs');
        }
        const frontendUsers = await this.userService.findByIds(dto.frontendDevs);
        if (frontendUsers.length !== dto.frontendDevs.length) {
          throw new BadRequestException('Invalid frontend developer IDs');
        }
        const existingFrontendDevs = new Set(project.frontendDevs.map(id => id.toString()));
        const newFrontendDevs = dto.frontendDevs.filter(id => !existingFrontendDevs.has(id));
        project.frontendDevs = [...project.frontendDevs, ...newFrontendDevs.map(id => new Types.ObjectId(id))];
        
        for (const user of frontendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Added to Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been added to the project "${project.name}" as a frontend developer by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
        if (newFrontendDevs.length > 0 && project.trelloBoardId) {
          await this.trelloBoardService.addUsers(project.trelloBoardId.toString(), newFrontendDevs, actorId);
        }
      }

      if (dto.backendDevs?.length) {
        const uniqueBackendDevs = new Set(dto.backendDevs);
        if (uniqueBackendDevs.size !== dto.backendDevs.length) {
          throw new BadRequestException('Duplicate IDs found in backendDevs');
        }
        const backendUsers = await this.userService.findByIds(dto.backendDevs);
        if (backendUsers.length !== dto.backendDevs.length) {
          throw new BadRequestException('Invalid backend developer IDs');
        }
        const existingBackendDevs = new Set(project.backendDevs.map(id => id.toString()));
        const newBackendDevs = dto.backendDevs.filter(id => !existingBackendDevs.has(id));
        project.backendDevs = [...project.backendDevs, ...newBackendDevs.map(id => new Types.ObjectId(id))];

        for (const user of backendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Added to Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been added to the project "${project.name}" as a backend developer by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
        if (newBackendDevs.length > 0 && project.trelloBoardId) {
          await this.trelloBoardService.addUsers(project.trelloBoardId.toString(), newBackendDevs, actorId);
        }
      }

      return await project.save();
    } catch (err) {
      console.error('Error adding members to project:', err);
      throw new BadRequestException(err.message);
    }
  }

  async removeMembers(id: string, dto: RemoveMemberDto, actorId: string): Promise<ProjectDocument> {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new BadRequestException('Project not found');
      }

      const actor = await this.userService.findById(actorId);
      if (!actor) {
        throw new BadRequestException('Invalid actor ID');
      }

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
       
        for (const user of frontendUsers) {
          await this.mailService.sendMail({
            to: user.email,
            subject: `Removed from Project: ${project.name}`,
            text: `Hello ${user.name},\n\nYou have been removed from the project "${project.name}" by ${actor.name}.\n\nBest regards,\nProject Management Team`,
          });
        }
      }

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
      console.error('Error removing members from project:', err);
      throw new BadRequestException(err.message);
    }
  }

  async getAllProjectStats(userId: string): Promise<ProjectStats[]> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view project stats');
      }

      const projects = await this.projectModel
        .find()
        .populate('createdBy', 'name email')
        .populate('projectManager', 'name email')
        .populate('frontendDevs', 'name email')
        .populate('backendDevs', 'name email')
        .populate('trelloBoardId', 'name')
        .lean()
        .exec();

      const projectStats = await Promise.all(
        projects.map(async (project) => {
          const trelloBoardId = (project.trelloBoardId as unknown as PopulatedTrelloBoard | null)?._id?.toString();
          let cardCount = 0;
          let assignedUsers: { userId: string; name: string; cardCount: number }[] = [];

          if (trelloBoardId) {
            const lists = await this.listModel.find({ board: trelloBoardId }).lean();
            const listIds = lists.map(list => list._id);

            const cards = await this.cardModel
              .find({ list: { $in: listIds } })
              .populate('assignedUsers', 'name email')
              .lean();

            cardCount = cards.length;

            const userCardCounts: { [key: string]: { name: string; count: number } } = {};
            for (const card of cards) {
              for (const user of (card.assignedUsers as unknown as PopulatedUser[] | undefined) || []) {
                const userId = user._id.toString();
                if (!userCardCounts[userId]) {
                  userCardCounts[userId] = { name: user.name, count: 0 };
                }
                userCardCounts[userId].count += 1;
              }
            }

            assignedUsers = Object.entries(userCardCounts).map(([userId, data]) => ({
              userId,
              name: data.name,
              cardCount: data.count,
            }));
          }

          return {
            projectId: project._id.toString(),
            projectName: project.name,
            projectManager: project.projectManager
              ? { id: (project.projectManager as unknown as PopulatedUser)._id.toString(), name: (project.projectManager as unknown as PopulatedUser).name }
              : null,
            frontendDevs: (project.frontendDevs as unknown as PopulatedUser[]).map(dev => ({
              id: dev._id.toString(),
              name: dev.name,
            })),
            backendDevs: (project.backendDevs as unknown as PopulatedUser[]).map(dev => ({
              id: dev._id.toString(),
              name: dev.name,
            })),
            trelloBoard: project.trelloBoardId
              ? { id: (project.trelloBoardId as unknown as PopulatedTrelloBoard)._id.toString(), name: (project.trelloBoardId as unknown as PopulatedTrelloBoard).name }
              : null,
            cardCount,
            assignedUsers,
          };
        })
      );

      return projectStats;
    } catch (err) {
      console.error('Error in getAllProjectStats:', err);
      throw new BadRequestException(err.message);
    }
  }


//   async getAllProjectStats(userId: string): Promise<ProjectStats[]> {
//   try {
//     // Verify user authorization
//     const user = await this.userService.findById(userId);
//     if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
//       throw new UnauthorizedException('Only CEO or Manager can view project stats');
//     }

//     // Aggregation pipeline
//     const pipeline = [
//       // Stage 1: Lookup for createdBy
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'createdBy',
//           foreignField: '_id',
//           as: 'createdBy',
//         },
//       },
//       { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },

//       // Stage 2: Lookup for projectManager
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'projectManager',
//           foreignField: '_id',
//           as: 'projectManager',
//         },
//       },
//       { $unwind: { path: '$projectManager', preserveNullAndEmptyArrays: true } },

//       // Stage 3: Lookup for frontendDevs
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'frontendDevs',
//           foreignField: '_id',
//           as: 'frontendDevs',
//         },
//       },

//       // Stage 4: Lookup for backendDevs
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'backendDevs',
//           foreignField: '_id',
//           as: 'backendDevs',
//         },
//       },

//       // Stage 5: Lookup for trelloBoardId
//       {
//         $lookup: {
//           from: 'trelloboards',
//           localField: 'trelloBoardId',
//           foreignField: '_id',
//           as: 'trelloBoardId',
//         },
//       },
//       { $unwind: { path: '$trelloBoardId', preserveNullAndEmptyArrays: true } },

//       // Stage 6: Lookup for lists associated with the Trello board
//       {
//         $lookup: {
//           from: 'lists',
//           localField: 'trelloBoardId._id',
//           foreignField: 'board',
//           as: 'lists',
//         },
//       },

//       // Stage 7: Lookup for cards in the lists
//       {
//         $lookup: {
//           from: 'cards',
//           let: { listIds: '$lists._id' },
//           pipeline: [
//             { $match: { $expr: { $in: ['$list', '$$listIds'] } } }, // Corrected to match cards.list
//             {
//               $lookup: {
//                 from: 'users',
//                 localField: 'assignedUsers',
//                 foreignField: '_id',
//                 as: 'assignedUsers',
//               },
//             },
//           ],
//           as: 'cards',
//         },
//       },

//       // Stage 8: Compute card count
//       {
//         $addFields: {
//           cardCount: { $size: '$cards' },
//         },
//       },

//       // Stage 9: Unwind cards and assignedUsers for grouping
//       {
//         $unwind: { path: '$cards', preserveNullAndEmptyArrays: true },
//       },
//       {
//         $unwind: { path: '$cards.assignedUsers', preserveNullAndEmptyArrays: true },
//       },

//       // Stage 10: Group to compute assignedUsers card counts
//       {
//         $group: {
//           _id: {
//             projectId: '$_id',
//             userId: '$cards.assignedUsers._id',
//           },
//           projectName: { $first: '$name' },
//           projectManager: { $first: '$projectManager' },
//           frontendDevs: { $first: '$frontendDevs' },
//           backendDevs: { $first: '$backendDevs' },
//           trelloBoardId: { $first: '$trelloBoardId' },
//           cardCount: { $first: '$cardCount' },
//           userName: { $first: '$cards.assignedUsers.name' },
//           userCardCount: { $sum: { $cond: { if: '$cards.assignedUsers._id', then: 1, else: 0 } } },
//         },
//       },

//       // Stage 11: Group by project to reconstruct assignedUsers array
//       {
//         $group: {
//           _id: '$_id.projectId',
//           projectName: { $first: '$projectName' },
//           projectManager: { $first: '$projectManager' },
//           frontendDevs: { $first: '$frontendDevs' },
//           backendDevs: { $first: '$backendDevs' },
//           trelloBoardId: { $first: '$trelloBoardId' },
//           cardCount: { $first: '$cardCount' },
//           assignedUsers: {
//             $push: {
//               $cond: {
//                 if: '$_id.userId',
//                 then: {
//                   userId: { $toString: '$_id.userId' },
//                   name: '$userName',
//                   cardCount: '$userCardCount',
//                 },
//                 else: '$$REMOVE',
//               },
//             },
//           },
//         },
//       },

//       // Stage 12: Project the final output to match ProjectStats interface
//       {
//         $project: {
//           projectId: { $toString: '$_id' },
//           projectName: 1,
//           projectManager: {
//             $cond: {
//               if: '$projectManager',
//               then: {
//                 id: { $toString: '$projectManager._id' },
//                 name: '$projectManager.name',
//               },
//               else: null,
//             },
//           },
//           frontendDevs: {
//             $map: {
//               input: '$frontendDevs',
//               as: 'dev',
//               in: {
//                 id: { $toString: '$$dev._id' },
//                 name: '$$dev.name',
//               },
//             },
//           },
//           backendDevs: {
//             $map: {
//               input: '$backendDevs',
//               as: 'dev',
//               in: {
//                 id: { $toString: '$$dev._id' },
//                 name: '$$dev.name',
//               },
//             },
//           },
//           trelloBoard: {
//             $cond: {
//               if: '$trelloBoardId',
//               then: {
//                 id: { $toString: '$trelloBoardId._id' },
//                 name: '$trelloBoardId.name',
//               },
//               else: null,
//             },
//           },
//           cardCount: 1,
//           assignedUsers: 1,
//           _id: 0,
//         },
//       },
//     ];

//     // Execute the aggregation pipeline
//     const projectStats = await this.projectModel.aggregate(pipeline).exec();

//     return projectStats;
//   } catch (err) {
//     console.error('Error in getAllProjectStats:', err);
//     throw new BadRequestException(err.message);
//   }
// }
}