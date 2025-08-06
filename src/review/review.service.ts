import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument, ReviewType } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserService } from '../user/user.service';
import { ProjectService } from '../project/project.service';
import { UserType } from '../user/types/user';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    private userService: UserService,
    private projectService: ProjectService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewDocument> {
    try {
      // Verify user exists
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Restrict review creation to CEO or Manager
      if (![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can create reviews');
      }

      // Validate that either projectId or userId is provided, but not both
      if (!createReviewDto.projectId && !createReviewDto.userId) {
        throw new BadRequestException('Either projectId or userId must be provided');
      }
      if (createReviewDto.projectId && createReviewDto.userId) {
        throw new BadRequestException('Provide only one of projectId or userId');
      }

      // Validate projectId if provided
      if (createReviewDto.projectId) {
        const project = await this.projectService.findById(createReviewDto.projectId);
        if (!project) {
          throw new BadRequestException('Project not found');
        }
      }

      // Validate userId if provided
      if (createReviewDto.userId) {
        const reviewedUser = await this.userService.findById(createReviewDto.userId);
        if (!reviewedUser) {
          throw new BadRequestException('Reviewed user not found');
        }
      }

      // Determine reviewType
      const reviewType = createReviewDto.projectId ? ReviewType.PROJECT : ReviewType.USER;

      const createdReview = new this.reviewModel({
        ...createReviewDto,
        reviewedBy: userId,
        reviewType,
      });
      return await createdReview.save();
    } catch (err) {
      console.error('Error creating review:', err);
      throw new BadRequestException(err.message);
    }
  }

  async findAllProjectReviews(userId: string): Promise<ReviewDocument[]> {
    try {
      // Verify user exists and is CEO or Manager
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view project reviews');
      }

      return await this.reviewModel
        .find({ reviewType: ReviewType.PROJECT })
        .populate('reviewedBy', 'name email')
        .populate('projectId', 'name description')
        .exec();
    } catch (err) {
      console.error('Error fetching project reviews:', err);
      throw new BadRequestException(err.message);
    }
  }

  async findAllUserReviews(userId: string): Promise<ReviewDocument[]> {
    try {
      // Verify user exists and is CEO or Manager
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view user reviews');
      }

      return await this.reviewModel
        .find({ reviewType: ReviewType.USER })
        .populate('reviewedBy', 'name email')
        .populate('userId', 'name email')
        .exec();
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      throw new BadRequestException(err.message);
    }
  }

  async findMyReviews(userId: string): Promise<ReviewDocument[]> {
    try {
      // Verify user exists
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return await this.reviewModel
        .find({ reviewType: ReviewType.USER, userId })
        .populate('reviewedBy', 'name email')
        .populate('userId', 'name email')
        .exec();
    } catch (err) {
      console.error('Error fetching my reviews:', err);
      throw new BadRequestException(err.message);
    }
  }

  async findMyProjectReviews(userId: string): Promise<ReviewDocument[]> {
    try {
      
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const projects = await this.projectService.findMyProjects(userId);
      console.log('User projects:', projects); 
      if (!projects || projects.length === 0) {
        throw new BadRequestException('You are not linked to any projects');
      }

      const projectIds = projects.map(project => project._id);
      console.log('Project IDs:', projectIds); 

      
      const result = await this.reviewModel
        .find({ 
        //   reviewType: ReviewType.PROJECT, 
        //   projectId: { $in: projectIds }
          projectId:  projectIds[0]
        })
        // .populate('reviewedBy', 'name email')
        // .populate('projectId', 'name description')
        .exec();
        console.log('Reviews found:', result);
        return result
    } catch (err) {
      console.error('Error fetching my project reviews:', err);
      throw new BadRequestException(err.message);
    }
  }
}