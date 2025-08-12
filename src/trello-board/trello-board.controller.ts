import { Body, Controller, Post, UseGuards, Request, Get, Param, Delete, UnauthorizedException, BadRequestException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TrelloBoardService } from './trello-board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateBoardDto } from './dto/create-board.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { AddAttachmentsDto } from './dto/add-attachments.dto';
import { RemoveAttachmentsDto } from './dto/remove-attachments.dto';

@ApiTags('trello-board')
@ApiBearerAuth('JWT')
@Controller('trello-board')
export class TrelloBoardController {
  constructor(private readonly trelloBoardService: TrelloBoardService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new Trello board' })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateBoardDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.create(dto.name, req.user.sub);
  }

  @Post('add-users/:boardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invite users to a Trello board' })
  @ApiResponse({ status: 201, description: 'Users invited successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'boardId', description: 'Board ID', type: String })
  async addUsers(@Param('boardId') boardId: string, @Body() dto: AddUsersDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.trelloBoardService.addUsers(boardId, dto.userIds, req.user.sub);
    return { message: 'Invitations sent successfully' };
  }

  @Get('accept-invitation/:boardId/:token')
  @ApiOperation({ summary: 'Accept an invitation to a Trello board' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  @ApiParam({ name: 'boardId', description: 'Board ID', type: String })
  @ApiParam({ name: 'token', description: 'Invitation token', type: String })
  async acceptInvitation(@Param('boardId') boardId: string, @Param('token') token: string) {
    await this.trelloBoardService.acceptInvitation(boardId, token);
    return { message: 'You have successfully joined the board' };
  }

  @Post('create-list')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new list on a Trello board' })
  @ApiResponse({ status: 201, description: 'List created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createList(@Body() dto: CreateListDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.createList(dto.boardId, dto.name, req.user.sub);
  }

  @Post('update-list/:listId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an existing list on a Trello board' })
  @ApiResponse({ status: 200, description: 'List updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'listId', description: 'List ID', type: String })
  async updateList(
    @Param('listId') listId: string,
    @Body() dto: UpdateListDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.updateList(listId, dto.name, req.user.sub);
  }

  @Delete('delete-list/:listId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a list from a Trello board' })
  @ApiResponse({ status: 200, description: 'List deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'listId', description: 'List ID', type: String })
  async deleteList(@Param('listId') listId: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.trelloBoardService.deleteList(listId, req.user.sub);
    return { message: 'List deleted successfully' };
  }

  @Post('create-card')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new card on a Trello board list' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createCard(@Body() dto: CreateCardDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.createCard(
      dto.name,
      dto.listId,
      req.user.sub,
      dto.description,
      dto.dueDate,
    );
  }

  @Post('add-members/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add members to a card' })
  @ApiResponse({ status: 200, description: 'Members added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  async addMembersToCard(
    @Param('cardId') cardId: string,
    @Body() dto: AddMembersDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.addMembersToCard(cardId, dto.userIds, req.user.sub);
  }

  @Post('remove-members/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove members from a card' })
  @ApiResponse({ status: 200, description: 'Members removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  async removeMembersFromCard(
    @Param('cardId') cardId: string,
    @Body() dto: RemoveMembersDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.removeMembersFromCard(cardId, dto.userIds, req.user.sub);
  }

  @Post('update-card/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an existing card on a Trello board' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  async updateCard(
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.updateCard(cardId, req.user.sub, {
      name: dto.name,
      description: dto.description,
      listId: dto.listId,
      dueDate: dto.dueDate,
    });
  }

  @Delete('delete-card/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a card from a Trello board list' })
  @ApiResponse({ status: 200, description: 'Card deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  async deleteCard(@Param('cardId') cardId: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.trelloBoardService.deleteCard(cardId, req.user.sub);
    return { message: 'Card deleted successfully' };
  }

  @Get('my-boards')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all boards the user is a member of' })
  @ApiResponse({ status: 200, description: 'Boards fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyBoards(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.getMyBoards(req.user.sub);
  }

  @Get('board-members/:boardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all members of a Trello board' })
  @ApiResponse({ status: 200, description: 'Members fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'boardId', description: 'Board ID', type: String })
  async getBoardMembers(@Param('boardId') boardId: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.getBoardMembers(boardId, req.user.sub);
  }

  @Get('board-lists/:boardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all lists of a Trello board with their cards' })
  @ApiResponse({ status: 200, description: 'Lists and their cards fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'boardId', description: 'Board ID', type: String })
  async getBoardLists(@Param('boardId') boardId: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!boardId) {
      throw new BadRequestException('Board ID is required');
    }
    return this.trelloBoardService.getBoardLists(boardId, req.user.sub);
  }

  @Get('card-details/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get details of a specific card' })
  @ApiResponse({ status: 200, description: 'Card details fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  async getCardDetails(@Param('cardId') cardId: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.getCardDetails(cardId, req.user.sub);
  }

  @Post('add-attachments/:cardId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  @ApiOperation({ summary: 'Add attachments to a card' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Attachments added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  @ApiBody({
    description: 'Upload multiple image files',
    type: AddAttachmentsDto,
  })
  async addAttachmentsToCard(
    @Param('cardId') cardId: string,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.addAttachmentsToCard(cardId, files.files || [], req.user.sub);
  }

  @Post('remove-attachments/:cardId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove attachments from a card' })
  @ApiResponse({ status: 200, description: 'Attachments removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'cardId', description: 'Card ID', type: String })
  @ApiBody({
    description: 'List of attachment URLs to remove',
    type: RemoveAttachmentsDto,
  })
  async removeAttachmentsFromCard(
    @Param('cardId') cardId: string,
    @Body() dto: RemoveAttachmentsDto,
    @Request() req,
  ) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.trelloBoardService.removeAttachmentsFromCard(cardId, dto.attachmentUrls, req.user.sub);
  }
}