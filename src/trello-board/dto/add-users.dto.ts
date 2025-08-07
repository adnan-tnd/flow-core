import { IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddUsersDto {
  @ApiProperty({ description: 'Array of user IDs to invite to the board', example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @IsArray()
  @IsMongoId({ each: true })
  userIds: string[];
}