import { Controller,Body, Post, Get, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserType } from '../user/types/user';

@ApiTags('reviews')
@ApiBearerAuth('JWT')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a new review for a project or user' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateReviewDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.reviewService.create(dto, req.user.sub);
  }

  @Get('project-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all project reviews (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all project reviews' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllProjectReviews(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.reviewService.findAllProjectReviews(req.user.sub);
  }

  @Get('user-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all user reviews (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all user reviews' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUserReviews(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.reviewService.findAllUserReviews(req.user.sub);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all reviews about the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of reviews about the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReviews(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.reviewService.findMyReviews(req.user.sub);
  }

  @Get('my-project-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all reviews for projects the authenticated user is linked to' })
  @ApiResponse({ status: 200, description: 'List of reviews for linked projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'User not linked to any projects' })
  async getMyProjectReviews(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return await this.reviewService.findMyProjectReviews(req.user.sub);
  }
}