// src/trello-board/dto/add-attachments.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AddAttachmentsDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Array of image files to upload',
  })
  files: Express.Multer.File[];
}