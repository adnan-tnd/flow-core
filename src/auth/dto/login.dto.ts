import { IsEmail,IsString,IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import{ UserType } from 'src/auth/types/auth';

export class LoginDto {
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
