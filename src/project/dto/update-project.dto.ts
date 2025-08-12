import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../types/project';

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name', example: 'My Project' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Project description', example: 'This is a sample project.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project manager user ID', example: '64c8e2f2b8d2a2a5e8b7c123' })
  @IsOptional()
  @IsString()
  projectManager?: string;

  @ApiPropertyOptional({ description: 'Frontend developer user IDs', type: [String], example: ['64c8e2f2b8d2a2a5e8b7c123'] })
  @IsOptional()
  @IsArray()
  frontendDevs?: string[];

  @ApiPropertyOptional({ description: 'Backend developer user IDs', type: [String], example: ['64c8e2f2b8d2a2a5e8b7c456'] })
  @IsOptional()
  @IsArray()
  backendDevs?: string[];

  @ApiPropertyOptional({ description: 'Project status', enum: ProjectStatus, example: ProjectStatus.ToDo })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}