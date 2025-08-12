import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrelloBoard, TrelloBoardDocument } from './schemas/trello-board.schema';
import { Card, CardDocument } from './schemas/card.schema';
import { List, ListDocument } from './schemas/list.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { UserType } from '../user/types/user';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { UserDocument } from '../user/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as stream from 'stream';
import { CardStatus } from 'src/trello-board/types/card';

interface CloudinaryUploadResult {
  secure_url: string;
  [key: string]: any;
}

@Injectable()
export class TrelloBoardService {
  constructor(
    @InjectModel(TrelloBoard.name)
    private trelloBoardModel: Model<TrelloBoardDocument>,
    @InjectModel(List.name)
    private listModel: Model<ListDocument>,
    @InjectModel(Card.name)
    private cardModel: Model<CardDocument>,
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    private userService: UserService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async addComment(
    cardId: string,
    text: string,
    userId: string,
  ): Promise<CommentDocument> {
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can add comments to cards');
      }

      const createdComment = new this.commentModel({
        commentBy: userIdObj,
        text,
        card: new Types.ObjectId(cardId),
        time: new Date(),
      });

      return await createdComment.save();
    } catch (err) {
      console.error('Error in addComment:', err);
      throw new BadRequestException(err.message);
    }
  }

  async updateComment(
    commentId: string,
    text: string,
    userId: string,
  ): Promise<CommentDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        throw new BadRequestException('Comment not found');
      }

      const card = await this.cardModel.findById(comment.card);
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can update comments');
      }

      if (!comment.commentBy.equals(userIdObj) && !isPrivilegedRole) {
        throw new UnauthorizedException('Only the comment creator or privileged users can update this comment');
      }

      comment.text = text;
      return await comment.save();
    } catch (err) {
      console.error('Error in updateComment:', err);
      throw new BadRequestException(err.message);
    }
  }

  async getComments(cardId: string, userId: string,): Promise<CommentDocument[]> { 
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can add comments to cards');
      }
      const comments = await this.commentModel
        .find({ card: cardId })
        .populate('commentBy', 'name email') // Populate user details
        .sort({ time: -1 }) // Sort by time in descending order
        .exec();
      return comments;      
    } catch (err) {
      console.error('Error in getComments:', err);

      throw new BadRequestException(err.message);
    }
  }


  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        throw new BadRequestException('Comment not found');
      }

      const card = await this.cardModel.findById(comment.card);
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can delete comments');
      }

      if (!comment.commentBy.equals(userIdObj) && !isPrivilegedRole) {
        throw new UnauthorizedException('Only the comment creator or privileged users can delete this comment');
      }

      await this.commentModel.deleteOne({ _id: commentId });
    } catch (err) {
      console.error('Error in deleteComment:', err);
      throw new BadRequestException(err.message);
    }
  }

  async addAttachmentsToCard(
    cardId: string,
    files: Express.Multer.File[],
    userId: string,
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can add attachments to cards');
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const maxFileSize = 5 * 1024 * 1024;
      const maxAttachments = 10;
      if (card.attachments.length + files.length > maxAttachments) {
        throw new BadRequestException(`Cannot add more than ${maxAttachments} attachments to a card`);
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            `Invalid file type for ${file.originalname}. Only JPEG, PNG, and GIF are allowed.`,
          );
        }
        if (file.size > maxFileSize) {
          throw new BadRequestException(
            `File ${file.originalname} exceeds the maximum size of ${maxFileSize / 1024 / 1024}MB`,
          );
        }
      }

      const uploadPromises = files.map(async (file) => {
        return new Promise<string>((resolve, reject) => {
          const uploader = cloudinary.uploader.upload_stream(
            {
              folder: `cards/${cardId}`,
              resource_type: 'image',
              public_id: `${uuidv4()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
            },
            (error, result: CloudinaryUploadResult | undefined) => {
              if (error || !result) {
                reject(error || new Error('Upload result is undefined'));
              } else {
                resolve(result.secure_url);
              }
            },
          );

          const readableStream = stream.Readable.from(file.buffer);
          readableStream.pipe(uploader);
        });
      });

      let attachmentUrls: string[];
      try {
        attachmentUrls = await Promise.all(uploadPromises);
      } catch (error) {
        throw new BadRequestException(`Failed to upload file: ${(error as Error).message}`);
      }

      card.attachments = [...card.attachments, ...attachmentUrls];
      const updatedCard = await card.save();

      return updatedCard;
    } catch (err) {
      console.error('Error in addAttachmentsToCard:', err);
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to add attachments to card');
    }
  }

  async removeAttachmentsFromCard(
    cardId: string,
    attachmentUrls: string[],
    userId: string,
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
        throw new UnauthorizedException('Only board members, CEO, or Manager can remove attachments from cards');
      }

      if (!attachmentUrls || attachmentUrls.length === 0) {
        throw new BadRequestException('No attachment URLs provided');
      }

      const invalidUrls = attachmentUrls.filter(url => !card.attachments.includes(url));
      if (invalidUrls.length > 0) {
        throw new BadRequestException('One or more attachment URLs are invalid or not found');
      }

      card.attachments = card.attachments.filter(url => !attachmentUrls.includes(url));
      const updatedCard = await card.save();

      return updatedCard;
    } catch (err) {
      console.error('Error in removeAttachmentsFromCard:', err);
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to remove attachments from card');
    }
  }

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
        lastCardNumber: 0,
      });
      return await createdBoard.save();
    } catch (err) {
      console.error('Error in create:', err);
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
      console.error('Error in addUsers:', err);
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
      console.error('Error in acceptInvitation:', err);
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
      console.error('Error in createList:', err);
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
      console.error('Error in deleteList:', err);
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
      console.error('Error in updateList:', err);
      throw new BadRequestException(err.message);
    }
  }

  async getBoardLists(boardId: string, userId: string): Promise<Array<{ _id: string; name: string; cards: Array<{ _id: string; name: string; status: CardStatus; cardNumber: number }> }>> {
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
            .select('_id name status cardNumber')
            .lean();
          return {
            _id: list._id.toString(),
            name: list.name,
            cards: cards.map((card) => ({
              _id: card._id.toString(),
              name: card.name,
              status: card.status,
              cardNumber: card.cardNumber,
            })),
          };
        }),
      );

      return listsWithCards;
    } catch (err) {
      console.error('Error in getBoardLists:', err);
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
      console.error('Error in getMyBoards:', err);
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
      console.error('Error in getBoardMembers:', err);
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

      board.lastCardNumber = (board.lastCardNumber || 0) + 1;
      await board.save();

      const createdCard = new this.cardModel({
        name,
        description,
        assignedUsers: [],
        list: new Types.ObjectId(listId),
        createdBy: userIdObj,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        cardNumber: board.lastCardNumber,
        status: CardStatus.Pending,
      });
      const savedCard = await createdCard.save();
      console.log('Created card with status:', savedCard.status, 'and cardNumber:', savedCard.cardNumber);
      return savedCard;
    } catch (err) {
      console.error('Error in createCard:', err);
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
      console.error('Error in addMembersToCard:', err);
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
      console.error('Error in removeMembersFromCard:', err);
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
      status?: CardStatus;
    },
  ): Promise<CardDocument> {
    try {
      console.log('updateCard called with cardId:', cardId, 'userId:', userId, 'updateData:', updateData);

      const user = await this.userService.findById(userId);
      if (!user || !user._id) {
        throw new UnauthorizedException('User not authenticated');
      }

      const card = await this.cardModel.findById(cardId);
      if (!card) {
        throw new BadRequestException('Card not found');
      }
      console.log('Current card status:', card.status);

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

      if (updateData.name) {
        card.name = updateData.name;
        console.log('Updating name to:', updateData.name);
      }
      if (updateData.description) {
        card.description = updateData.description;
        console.log('Updating description to:', updateData.description);
      }
      if (updateData.dueDate !== undefined) {
        card.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : undefined;
        console.log('Updating dueDate to:', card.dueDate);
      }
      if (updateData.status && Object.values(CardStatus).includes(updateData.status)) {
        console.log('Updating status from:', card.status, 'to:', updateData.status);
        card.status = updateData.status;
      } else if (updateData.status) {
        throw new BadRequestException(`Invalid status value: ${updateData.status}`);
      }

      const updatedCard = await card.save();
      console.log('Saved card with status:', updatedCard.status);

      if (updateData.status && updateData.status !== card.status) {
        for (const assignedUserId of card.assignedUsers) {
          const assignedUser = await this.userService.findById(assignedUserId.toString());
          if (assignedUser) {
            const cardLink = `http://your-app-domain.com/card/${updatedCard._id}`;
            await this.mailService.sendMail({
              to: assignedUser.email,
              subject: `Card Status Updated: ${card.name} on Board: ${board.name}`,
              text: `The status of card "${card.name}" on board "${board.name}" has been updated to ${updatedCard.status} by ${user.name}. Click here to view: ${cardLink}`,
            });
          }
        }
      }

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
      console.error('Error in updateCard:', err);
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
      console.error('Error in deleteCard:', err);
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
      console.error('Error in getCardDetails:', err);
      throw new BadRequestException(err.message);
    }
  }
}