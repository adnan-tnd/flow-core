import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/user/schemas/user.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(dto: SignupDto): Promise<{ message: string; access_token: string }> {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const user = await this.userService.create(dto);
    
    const userId = user._id?.toString?.() || user.id;

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
    console.log('Login attempt with email:', dto.email, 'type:', dto.type);
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
      message: 'Login successful',
      access_token: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userId = user._id?.toString?.() || user.id;
    const resetToken = this.jwtService.sign(
      { sub: userId, email: user.email, purpose: 'password-reset' },
      { expiresIn: '1d' }, // 1 day expiration
    );

    const resetLink = `http://your-frontend.com/reset-password?token=${resetToken}`; // Replace with your frontend URL

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click this link to reset your password: ${resetLink}\nThis link will expire in 1 day.`,
    });

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload;
    try {
      payload = this.jwtService.verify(dto.token);
      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid reset token');
    }

    await this.userService.updatePassword(payload.sub, dto.newPassword);

    return { message: 'Password reset successfully' };
  }
}