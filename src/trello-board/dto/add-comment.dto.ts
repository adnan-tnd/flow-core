import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ description: 'The text content of the comment' })
  @IsString()
  @IsNotEmpty()
  text: string;
}