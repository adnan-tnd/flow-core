import { Body, Controller, Post, Get, UseGuards, Request, BadRequestException, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { SprintService } from '../sprint/sprint.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { CreateSprintDto } from '../sprint/dto/create-sprint.dto';
import { UpdateSprintDto } from '../sprint/dto/update-sprint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserType } from '../user/types/user';

@ApiTags('project')
@ApiBearerAuth('JWT')
@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly sprintService: SprintService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateProjectDto, @Request() req) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.projectService.create(dto, req.user.sub);
  }

  @Post('sprint-create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a sprint for a project' })
  @ApiResponse({ status: 201, description: 'Sprint created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createSprint(
    @Body() dto: CreateSprintDto,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sprintService.create({ ...dto }, req.user.sub);
  }

  @Patch('/update-sprint/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a sprint for a project' })
  @ApiResponse({ status: 200, description: 'Sprint updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateSprint(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sprintService.update(id, dto, req.user.sub);
  }

  @Delete('/delete-sprint/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a sprint for a project' })
  @ApiResponse({ status: 200, description: 'Sprint deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async deleteSprint(
    @Param('id') id: string,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sprintService.delete(id, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all projects (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can view all projects');
    }
    return this.projectService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get projects linked to the current user' })
  @ApiResponse({ status: 200, description: 'List of user projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async myProjects(@Request() req) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.projectService.findMyProjects(req.user.sub);
  }

  @Get('details/:id')
  @ApiOperation({ summary: 'Get project details with sprints (public)' })
  @ApiResponse({ status: 200, description: 'Project details with associated sprints' })
  @ApiResponse({ status: 400, description: 'Project not found' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  async getProjectDetails(@Param('id') id: string) {
    const project = await this.projectService.findById(id);
    if (!project) {
      throw new BadRequestException('Project not found');
    }
    const sprints = await this.sprintService.findAllByProject(id);
    return {
      project,
      sprints,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a project (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can update projects');
    }
    return this.projectService.updateProject(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a project (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async delete(@Param('id') id: string, @Request() req) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can delete projects');
    }
    return this.projectService.deleteProject(id);
  }

  @Patch(':id/add-members')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add members to a project (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Members added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input or project not found' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  async addMembers(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can add members to projects');
    }
    return this.projectService.addMembers(id, dto);
  }

  @Patch(':id/remove-members')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove members from a project (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Members removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input or project not found' })
  @ApiParam({ name: 'id', description: 'Project ID', type: String })
  async removeMembers(
    @Param('id') id: string,
    @Body() dto: RemoveMemberDto,
    @Request() req,
  ) {
    console.log('Request user:', req.user); // Debug log
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can remove members from projects');
    }
    return this.projectService.removeMembers(id, dto);
  }
}