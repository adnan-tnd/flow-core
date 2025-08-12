import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: 'The updated text content of the comment' })
  @IsString()
  @IsNotEmpty()
  text: string;
}