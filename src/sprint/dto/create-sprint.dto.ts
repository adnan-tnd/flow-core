import { IsString, IsNotEmpty, IsDateString, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SprintStatus } from 'src/sprint/types/sprint';

export class CreateSprintDto {
  @ApiProperty({ description: 'Name of the sprint' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the sprint', required: false })
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time of the sprint (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time of the sprint (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;


  @ApiProperty({ description: 'ID of the associated project' })
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;
}