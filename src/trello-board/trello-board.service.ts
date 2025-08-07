import { Injectable, BadRequestException,ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrelloBoard, TrelloBoardDocument } from './schemas/trello-board.schema';
import { List, ListDocument } from './schemas/list.schema';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { UserType } from '../user/types/user';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class TrelloBoardService {
  constructor(
    @InjectModel(TrelloBoard.name)
    private trelloBoardModel: Model<TrelloBoardDocument>,
    @InjectModel(List.name)
    private listModel: Model<ListDocument>,
    private userService: UserService,
    private mailService: MailService,
  ) {}

  async create(name: string, userId: string): Promise<TrelloBoardDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can create boards');
      }

      const createdBoard = new this.trelloBoardModel({
        name,
        createdBy: new Types.ObjectId(userId),
        members: [new Types.ObjectId(userId)], // Creator is automatically a member
      });
      return await createdBoard.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async addUsers(boardId: string, userIds: string[], creatorId: string): Promise<void> {
    try {
      const user = await this.userService.findById(creatorId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can invite users to boards');
      }

      const board = await this.trelloBoardModel.findById(boardId);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const uniqueUserIds = new Set(userIds);
      if (uniqueUserIds.size !== userIds.length) {
        throw new BadRequestException('Duplicate user IDs provided');
      }

      const users = await this.userService.findByIds(userIds);
      if (users.length !== userIds.length) {
        throw new BadRequestException('Invalid user IDs provided');
      }

      const newInvitations: { token: string; userId: Types.ObjectId; expiresAt: Date }[] = [];
      for (const user of users) {
        if (!user._id) {
          throw new BadRequestException(`User with ID ${user.id} has no valid _id`);
        }
        const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
        if (
          board.members.some((id) => (id as Types.ObjectId).equals(userIdObj)) ||
          board.invitedUsers.some((id) => (id as Types.ObjectId).equals(userIdObj))
        ) {
          continue; // Skip users who are already members or invited
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
        newInvitations.push({ token, userId: userIdObj, expiresAt });

        // Send invitation email
        const acceptLink = `http://your-app-domain.com/trello-board/accept-invitation/${boardId}/${token}`;
        await this.mailService.sendMail({
          to: user.email,
          subject: `Invitation to join Trello Board: ${board.name}`,
          text: `You have been invited by ${user.name} to join the Trello board "${board.name}". Click here to accept: ${acceptLink}`,
        });

        board.invitedUsers.push(userIdObj);
      }

      board.pendingInvitations.push(...newInvitations);
      await board.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async acceptInvitation(boardId: string, token: string): Promise<void> {
    try {
      const board = await this.trelloBoardModel.findById(boardId);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const invitation = board.pendingInvitations.find(
        (inv) => inv.token === token && inv.expiresAt > new Date(),
      );
      if (!invitation) {
        throw new BadRequestException('Invalid or expired invitation token');
      }

      // Add user to members
      const userIdObj = invitation.userId;
      if (!board.members.some((id) => (id as Types.ObjectId).equals(userIdObj))) {
        board.members.push(userIdObj);
      }

      // Remove from invitedUsers and pendingInvitations
      board.invitedUsers = board.invitedUsers.filter((id) => !(id as Types.ObjectId).equals(userIdObj));
      board.pendingInvitations = board.pendingInvitations.filter((inv) => inv.token !== token);

      await board.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async createList(boardId: string, name: string, userId: string): Promise<ListDocument> {
  try {
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const board = await this.trelloBoardModel.findById(boardId);
    if (!board) {
      throw new BadRequestException('Board not found');
    }

    const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
    const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
    const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

    if (!isPrivilegedRole && !isBoardMember) {
      throw new UnauthorizedException('Only board members, CEO or Manager can create the list');
    }

    const createdList = new this.listModel({
      name,
      board: new Types.ObjectId(boardId),
      createdBy: userIdObj,
    });
    return await createdList.save();
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}

async deleteList(listId: string, userId: string): Promise<void> {
  try {
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const list = await this.listModel.findById(listId);
    if (!list) {
      throw new BadRequestException('List not found');
    }

    const board = await this.trelloBoardModel.findById(list.board);
    if (!board) {
      throw new BadRequestException('Board not found');
    }

    const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);

    // ✅ Check if user is CEO or MANAGER or board member
    const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
    const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

    if (!isPrivilegedRole && !isBoardMember) {
      throw new UnauthorizedException('Only board members, CEO or Manager can delete the list');
    }

    await this.listModel.deleteOne({ _id: listId });
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}

    async updateList(listId: string, newName: string, userId: string): Promise<ListDocument> {
    try {
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const list = await this.listModel.findById(listId);
    if (!list) {
      throw new BadRequestException('List not found');
    }

    const board = await this.trelloBoardModel.findById(list.board);
    if (!board) {
      throw new BadRequestException('Board not found');
    }

    const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);

    // ✅ Check if user is CEO or MANAGER or board member
    const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
    const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

    if (!isPrivilegedRole && !isBoardMember) {
      throw new UnauthorizedException('Only board members, CEO or Manager can update the list');
    }

    list.name = newName;
    return await list.save();
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}

  async getBoardLists(boardId: string, userId: string):  Promise<ListDocument[]> {
    try {
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }
      const board = await this.trelloBoardModel.findById(boardId);
      if (!board) {
        throw new BadRequestException('Board not found');
      }
      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);

    // ✅ Check if user is CEO or MANAGER or board member
    const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
    const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

    if (!isPrivilegedRole && !isBoardMember) {
      throw new UnauthorizedException('Only board members, CEO or Manager can see this board list');
    }

      return await this.listModel.find({ board: boardId }).exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }


  async getMyBoards(userId: string): Promise<{ _id: string; name: string }[]> {
  try {
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const boards = await this.trelloBoardModel
      .find({ members: user._id })
      .select('_id name') // Only select _id and name
      .lean(); // Convert Mongoose documents to plain JS objects

    return boards.map((board) => ({
      _id: board._id.toString(),
      name: board.name,
    }));
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}

async getBoardMembers(boardId: string, userId: string): Promise<UserDocument[]> {
  try {
    const board = await this.trelloBoardModel.findById(boardId).populate('members').exec();
    const user = await this.userService.findById(userId);
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!board) {
      throw new BadRequestException('Board not found');
    }

     const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);

    // ✅ Check if user is CEO or MANAGER or board member
    const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
    const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

    if (!isPrivilegedRole && !isBoardMember) {
      throw new UnauthorizedException('You are not allowed to view this board members');
    }
    return board.members.map((member: any) => {
      return {
        _id: member._id.toString(),
        name: member.name,
        email: member.email,
      } as UserDocument;
    });
  } catch (err) {
    throw new BadRequestException(err.message);
  }
}



}