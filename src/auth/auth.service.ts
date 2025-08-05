import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ message: string; access_token: string }> {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const user = await this.userService.create(dto);
    
    // Use either ._id?.toString() or .id fallback
    const userId = user._id?.toString?.() || user.id;

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: userId,
      email: user.email,
      type: user.type,
    });

    return {
      message: 'Signup successfully',
      access_token: token,
    };
  }

  async login(dto: LoginDto): Promise<{ message: string; access_token: string }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (dto.type !== user.type) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = user._id?.toString?.() || user.id;

    const token = this.jwtService.sign({
      sub: userId,
      email: user.email,
      type: user.type,
    });

    return {
      message: 'Login successfully',
      access_token: token,
     
    };
  }
}