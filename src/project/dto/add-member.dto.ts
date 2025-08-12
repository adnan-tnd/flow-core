import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsMongoId, ArrayNotEmpty } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    description: 'Array of frontend developer IDs to add to the project',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  frontendDevs?: string[];

  @ApiProperty({
    description: 'Array of backend developer IDs to add to the project',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayNotEmpty()
  backendDevs?: string[];
}