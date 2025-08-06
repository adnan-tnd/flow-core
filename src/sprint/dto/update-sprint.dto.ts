import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSprintDto {
  @ApiPropertyOptional({ description: 'The name of the sprint', example: 'Sprint 1 Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The description of the sprint', example: 'Updated first sprint' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'The start time of the sprint (ISO 8601 format)', example: '2025-08-07T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'The end time of the sprint (ISO 8601 format)', example: '2025-08-14T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'The status of the sprint', example: 'In Progress', enum: ['To Do', 'In Progress', 'Done'] })
  @IsString()
  @IsOptional()
  status?: string;
}