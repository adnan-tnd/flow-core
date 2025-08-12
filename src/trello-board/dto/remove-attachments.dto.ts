import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUrl } from 'class-validator';

export class RemoveAttachmentsDto {
  @ApiProperty({
    description: 'Array of attachment URLs to remove from the card',
    type: [String],
    example: ['https://res.cloudinary.com/example/image1.jpg', 'https://res.cloudinary.com/example/image2.jpg'],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  attachmentUrls: string[];
}