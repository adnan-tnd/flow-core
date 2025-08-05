import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
//   @ApiResponse({ status: 201, description: 'User successfully registered', type: Object })
//   @ApiResponse({ status: 409, description: 'Email already exists' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
//   @ApiResponse({ status: 201, description: 'User successfully logged in', type: Object })
//   @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
//   @ApiResponse({ status: 201, description: 'Password reset link sent to email', type: Object })
//   @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password using a token' })
//   @ApiResponse({ status: 201, description: 'Password reset successfully', type: Object })
//   @ApiResponse({ status: 401, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Access a protected route' })
//   @ApiResponse({ status: 200, description: 'Protected route accessed successfully', type: Object })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
  async protectedRoute() {
    return { message: 'This is a protected route' };
  }
}