import { IsEmail, IsString,IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import{ UserType } from 'src/auth/types/auth';
export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'test@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ description: 'User type', example: 'admin' })
    @IsEnum(UserType)

  @IsNotEmpty({ message: 'Type is required' })
  type: UserType;
}