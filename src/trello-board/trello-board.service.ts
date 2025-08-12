import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrelloBoard, TrelloBoardDocument } from './schemas/trello-board.schema';
import { Card, CardDocument } from './schemas/card.schema';
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
    @InjectModel(Card.name)
    private cardModel: Model<CardDocument>,
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
        members: [new Types.ObjectId(userId)],
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
          continue;
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        newInvitations.push({ token, userId: userIdObj, expiresAt });

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

      const userIdObj = invitation.userId;
      if (!board.members.some((id) => (id as Types.ObjectId).equals(userIdObj))) {
        board.members.push(userIdObj);
      }

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

  async getBoardLists(boardId: string, userId: string): Promise<Array<{ _id: string; name: string; cards: Array<{ _id: string; name: string }> }>> {
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
        throw new UnauthorizedException('Only board members, CEO or Manager can see this board list');
      }

      const lists = await this.listModel.find({ board: boardId }).lean();
      const listsWithCards = await Promise.all(
        lists.map(async (list) => {
          const cards = await this.cardModel
            .find({ list: list._id })
            .select('_id name')
            .lean();
          return {
            _id: list._id.toString(),
            name: list.name,
            cards: cards.map((card) => ({
              _id: card._id.toString(),
              name: card.name,
            })),
          };
        }),
      );

      return listsWithCards;
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
        .select('_id name')
        .lean();

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

  async createCard(
    name: string,
    listId: string,
    userId: string,
    description?: string,
    dueDate?: Date,
  ): Promise<CardDocument> {
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
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can create cards');
      }

      const createdCard = new this.cardModel({
        name,
        description,
        assignedUsers: [],
        list: new Types.ObjectId(listId),
        createdBy: userIdObj,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      return await createdCard.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async addMembersToCard(cardId: string, userIds: string[], userId: string): Promise<CardDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const card = await this.cardModel.findById(cardId);
      if (!card) {
        throw new BadRequestException('Card not found');
      }

      const list = await this.listModel.findById(card.list);
      if (!list) {
        throw new BadRequestException('List not found');
      }

      const board = await this.trelloBoardModel.findById(list.board);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can add members to cards');
      }

      const users = await this.userService.findByIds(userIds);
      if (users.length !== userIds.length) {
        throw new BadRequestException('Invalid user IDs provided');
      }

      const assignedUserIds = users
        .filter((u) => {
          if (!u._id) {
            throw new BadRequestException(`User with ID ${u.id} has no valid _id`);
          }
          return board.members.some((id) => (id as Types.ObjectId).equals(u._id as Types.ObjectId));
        })
        .map((u) => new Types.ObjectId(u._id as Types.ObjectId));

      if (assignedUserIds.length !== users.length) {
        throw new BadRequestException('One or more users are not members of this board');
      }

      const currentAssignedUserIds = card.assignedUsers.map((id) => id.toString());
      const newUsersToNotify = users.filter((u) => {
        if (!u._id) {
          throw new BadRequestException(`User with ID ${u.id} has no valid _id`);
        }
        return !currentAssignedUserIds.includes((u._id as Types.ObjectId).toString());
      });

      card.assignedUsers = [
        ...card.assignedUsers,
        ...assignedUserIds.filter(
          (id) => !card.assignedUsers.some((existingId) => existingId.equals(id)),
        ),
      ];

      const updatedCard = await card.save();

      for (const assignedUser of newUsersToNotify) {
        const cardLink = `http://your-app-domain.com/card/${updatedCard._id}`;
        await this.mailService.sendMail({
          to: assignedUser.email,
          subject: `Assigned to Card: ${card.name} on Board: ${board.name}`,
          text: `You have been assigned to the card "${card.name}" on the board "${board.name}" by ${user.name}. Click here to view: ${cardLink}`,
        });
      }

      return updatedCard;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async removeMembersFromCard(cardId: string, userIds: string[], userId: string): Promise<CardDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const card = await this.cardModel.findById(cardId);
      if (!card) {
        throw new BadRequestException('Card not found');
      }

      const list = await this.listModel.findById(card.list);
      if (!list) {
        throw new BadRequestException('List not found');
      }

      const board = await this.trelloBoardModel.findById(list.board);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can remove members from cards');
      }

      const users = await this.userService.findByIds(userIds);
      if (users.length !== userIds.length) {
        throw new BadRequestException('Invalid user IDs provided');
      }

      const userIdsToRemove = users
        .filter((u) => {
          if (!u._id) {
            throw new BadRequestException(`User with ID ${u.id} has no valid _id`);
          }
          return true;
        })
        .map((u) => new Types.ObjectId(u._id as Types.ObjectId));

      card.assignedUsers = card.assignedUsers.filter(
        (id) => !userIdsToRemove.some((removeId) => removeId.equals(id)),
      );

      return await card.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateCard(
    cardId: string,
    userId: string,
    updateData: {
      name?: string;
      description?: string;
      assignedUsers?: string[];
      listId?: string;
      dueDate?: Date;
    },
  ): Promise<CardDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const card = await this.cardModel.findById(cardId);
      if (!card) {
        throw new BadRequestException('Card not found');
      }

      const list = await this.listModel.findById(card.list);
      if (!list) {
        throw new BadRequestException('List not found');
      }

      const board = await this.trelloBoardModel.findById(list.board);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can update cards');
      }

      let usersToNotify: UserDocument[] = [];
      if (updateData.assignedUsers && updateData.assignedUsers.length > 0) {
        const users = await this.userService.findByIds(updateData.assignedUsers);
        if (users.length !== updateData.assignedUsers.length) {
          throw new BadRequestException('Invalid user IDs provided');
        }
        const assignedUserIds = users
          .filter((u) => {
            if (!u._id) {
              throw new BadRequestException(`User with ID ${u.id} has no valid _id`);
            }
            return board.members.some((id) => (id as Types.ObjectId).equals(u._id as Types.ObjectId));
          })
          .map((u) => new Types.ObjectId(u._id as Types.ObjectId));
        if (assignedUserIds.length !== users.length) {
          throw new BadRequestException('One or more users are not members of this board');
        }
        const currentAssignedUserIds = card.assignedUsers.map((id) => id.toString());
        usersToNotify = users.filter((u) => {
          if (!u._id) {
            throw new BadRequestException(`User with ID ${u.id} has no valid _id`);
          }
          return !currentAssignedUserIds.includes((u._id as Types.ObjectId).toString());
        });
        card.assignedUsers = assignedUserIds;
      }

      if (updateData.listId) {
        const newList = await this.listModel.findById(updateData.listId);
        if (!newList) {
          throw new BadRequestException('New list not found');
        }
        if (!newList.board.equals(list.board)) {
          throw new BadRequestException('New list must belong to the same board');
        }
        card.list = new Types.ObjectId(updateData.listId);
      }

      if (updateData.name) card.name = updateData.name;
      if (updateData.description) card.description = updateData.description;
      if (updateData.dueDate !== undefined) {
        card.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : undefined;
      }

      const updatedCard = await card.save();

      for (const assignedUser of usersToNotify) {
        const cardLink = `http://your-app-domain.com/card/${updatedCard._id}`;
        await this.mailService.sendMail({
          to: assignedUser.email,
          subject: `Assigned to Card: ${card.name} on Board: ${board.name}`,
          text: `You have been assigned to the card "${card.name}" on the board "${board.name}" by ${user.name}. Click here to view: ${cardLink}`,
        });
      }

      return updatedCard;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteCard(cardId: string, userId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const card = await this.cardModel.findById(cardId);
      if (!card) {
        throw new BadRequestException('Card not found');
      }

      const list = await this.listModel.findById(card.list);
      if (!list) {
        throw new BadRequestException('List not found');
      }

      const board = await this.trelloBoardModel.findById(list.board);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can delete cards');
      }

      await this.cardModel.deleteOne({ _id: cardId });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getCardDetails(cardId: string, userId: string): Promise<CardDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }
      
      const card = await this.cardModel.findById(cardId).populate('list').exec();
      if (!card) {
        throw new BadRequestException('Card not found');
      }
      const list = await this.listModel.findById(card.list);
      if (!list) {
        throw new BadRequestException('List not found');
      }
      const board = await this.trelloBoardModel.findById(list.board);
      if (!board) {
        throw new BadRequestException('Board not found');
      }

      const userIdObj = new Types.ObjectId(user._id as Types.ObjectId);
      const isBoardMember = board.members.some((id) => (id as Types.ObjectId).equals(userIdObj));
      const isPrivilegedRole = user.type === UserType.CEO || user.type === UserType.MANAGER;

      if (!isPrivilegedRole && !isBoardMember) {
        throw new UnauthorizedException('Only board members, CEO, or Manager can view card details');
      }

      return card;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}