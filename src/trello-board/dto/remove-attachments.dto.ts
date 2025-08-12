// src/trello-board/dto/remove-attachments.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class RemoveAttachmentsDto {
  @ApiProperty({
    type: [String],
    description: 'List of attachment URLs to remove',
  })
  @IsArray()
  @IsString({ each: true })
  attachmentUrls: string[];
}