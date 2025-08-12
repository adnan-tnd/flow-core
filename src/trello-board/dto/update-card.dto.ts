import { IsString, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CardStatus } from '../types/card'; // Adjust path as needed

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

  @ApiProperty({
    description: 'The updated status of the card',
    enum: CardStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;
}