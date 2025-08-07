import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListDto {
  @ApiProperty({ description: 'The ID of the Trello board', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  boardId: string;

  @ApiProperty({ description: 'The name of the list', example: 'To Do' })
  @IsString()
  @IsNotEmpty()
  name: string;
}