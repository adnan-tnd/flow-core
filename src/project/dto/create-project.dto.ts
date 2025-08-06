import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Array of frontend developer IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  frontendDevs?: string[];

  @ApiProperty({ description: 'Array of backend developer IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  backendDevs?: string[];
}