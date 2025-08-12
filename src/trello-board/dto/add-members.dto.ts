import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to assign to the card (must be board members)',
    example: ['60d1f8b3c4d5e6f7890abc12', '60d1f8b3c4d5e6f7890abc34'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}