import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to remove from the card',
    example: ['60d1f8b3c4d5e6f7890abc12', '60d1f8b3c4d5e6f7890abc34'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}