import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiProperty({
    description: 'The name of the card',
    example: 'Implement login feature',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The ID of the list to which the card belongs',
    example: '60d1f8b3c4d5e6f7890abcde',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  listId: string;

  @ApiProperty({
    description: 'A description of the card',
    example: 'Add authentication and authorization logic',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of user IDs assigned to the card (must be board members)',
    example: ['60d1f8b3c4d5e6f7890abc12', '60d1f8b3c4d5e6f7890abc34'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUsers?: string[];

  @ApiProperty({
    description: 'The due date for the card in ISO 8601 format',
    example: '2025-08-10T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}