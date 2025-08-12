import { ApiProperty } from '@nestjs/swagger';
import { MulterField as Multer } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
export class AddAttachmentsDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Array of image files to upload',
  })
  files: Express.Multer.File[];
}