import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ description: 'The name of the Trello board', example: 'Project Planning Board' })
  @IsString()
  @IsNotEmpty()
  name: string;
}