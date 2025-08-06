import { IsNotEmpty, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', example: 4 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Comment for the review', example: 'Great work!' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ description: 'Project ID (optional, required if userId is not provided)', example: '60d5f3a4c1234567890abcde', required: false })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ description: 'User ID (optional, required if projectId is not provided)', example: '60d5f3a4c1234567890abcde', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}