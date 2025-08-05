import { IsEmail, IsEnum,IsString, IsNotEmpty, MinLength } from 'class-validator';

import{ UserType } from 'src/auth/types/auth';

export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEnum(UserType)
  @IsNotEmpty({ message: 'Type is required' })
  type: UserType;
}
