import { Body, Controller, Post, Get, UseGuards, Request, BadRequestException, Patch, Param } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from 'src/project/dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('project')
@ApiBearerAuth('JWT')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectService.create(dto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all projects (CEO/Manager only)' })
  async findAll(@Request() req) {
    const user = req.user;
    if (!user || !['ceo', 'manager'].includes(user.type)) {
      throw new BadRequestException('Only CEO or Manager can view all projects');
    }
    return this.projectService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get projects linked to the current user' })
  async myProjects(@Request() req) {
    const userId = req.user.sub;
    return this.projectService.findMyProjects(userId);
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
    const user = req.user;
    if (!user || !['ceo', 'manager'].includes(user.type)) {
      throw new BadRequestException('Only CEO or Manager can update projects');
    }
    return this.projectService.updateProject(id, dto);
  }
}