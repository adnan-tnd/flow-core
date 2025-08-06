import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserType } from './types/user';
import * as bcrypt from 'bcrypt';
import { SignupDto } from 'src/auth/dto/signup.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
      return await this.userModel.findOne({ email }).exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      console.log('Finding user by ID:', id); // Debug log
      const user = await this.userModel.findById(id).exec();
      console.log('User found:', user); // Debug log
      return user;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findByRoles(roles: UserType[]): Promise<UserDocument[]> {
    try {
      return await this.userModel.find({ type: { $in: roles } }).exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findByIds(ids: string[]): Promise<UserDocument[]> {
    try {
      console.log('Finding users by IDs:', ids); // Debug log
      const users = await this.userModel.find({ _id: { $in: ids } }).exec();
      console.log('Users found:', users); // Debug log
      return users;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userModel.findByIdAndUpdate(id, { password: hashedPassword }).exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}