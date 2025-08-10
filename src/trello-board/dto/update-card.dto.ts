import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCardDto {
  @ApiProperty({
    description: 'The updated name of the card',
    example: 'Update login feature',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The updated description of the card',
    example: 'Updated authentication logic with JWT',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of user IDs to assign to the card (must be board members)',
    example: ['60d1f8b3c4d5e6f7890abc12', '60d1f8b3c4d5e6f7890abc34'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUsers?: string[];

  @ApiProperty({
    description: 'The ID of the new list to move the card to (must belong to the same board)',
    example: 'test-id-1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  listId?: string;

  @ApiProperty({
    description: 'The updated due date for the card in ISO 8601 format (set to null to unset)',
    example: '2025-08-15T12:00:00Z',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}