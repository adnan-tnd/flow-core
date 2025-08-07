import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
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

      // Check if the user is a member of the board
      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      if (!board.members.some((id) => (id as Types.ObjectId).equals(userIdObj))) {
        throw new UnauthorizedException('Only board members can create lists');
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
}