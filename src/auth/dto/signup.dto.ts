import { IsEmail, IsEnum, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import{ UserType } from 'src/auth/types/auth';

export class SignupDto {
  @ApiProperty({ description: 'User email address', example: 'test@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;


  @ApiProperty({ description: 'User name', example: 'adnan' })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ description: 'User type', example: 'admin' })
  @IsEnum(UserType)
  @IsNotEmpty({ message: 'Type is required' })
  type: UserType;
}