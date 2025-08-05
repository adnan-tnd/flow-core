import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserType } from './schemas/user.schema';
import { SignupDto } from 'src/auth/dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: SignupDto): Promise<UserDocument> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });
      return await createdUser.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel
        .findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<UserDocument | null> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      return await this.userModel
        .findByIdAndUpdate(
          userId,
          { password: hashedPassword },
          { new: true },
        )
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findByRoles(roles: UserType[]): Promise<UserDocument[]> {
    try {
      return await this.userModel
        .find({ type: { $in: roles } })
        .select('email name')
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}