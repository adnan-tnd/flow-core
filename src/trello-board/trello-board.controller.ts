import { Body, Controller, Post, UseGuards, Request, BadRequestException, Get, Param, UnauthorizedException, Delete } from '@nestjs/common';
import { TrelloBoardService } from './trello-board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserType } from '../user/types/user';
import { CreateBoardDto } from './dto/create-board.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
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

  const userId = req.user.sub;

  return this.trelloBoardService.getBoardMembers(boardId, userId);
}

@Get('board-lists/:boardId')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get all lists of a Trello board' })
@ApiResponse({ status: 200, description: 'Lists fetched successfully' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
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
  return { message: 'List deleted Successfully' }      
}



}