import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the project' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Project manager ID', required: false })
  @IsOptional()
  @IsMongoId()
  projectManager?: string;

  @ApiPropertyOptional({
    description: 'List of frontend developer IDs (MongoDB ObjectId array)',
    example: ['64d23f9a4f1b2e6b3c8d1235', '64d23f9a4f1b2e6b3c8d1236'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  frontendDevs: string[] = [];

  @ApiPropertyOptional({
    description: 'List of backend developer IDs (MongoDB ObjectId array)',
    example: ['64d23f9a4f1b2e6b3c8d1237', '64d23f9a4f1b2e6b3c8d1238'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  backendDevs: string[] = [];
}
