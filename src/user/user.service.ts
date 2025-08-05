import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import{ SignupDto } from 'src/auth/dto/signup.dto'; // Assuming you have a SignupDto similar to CreateUserDto
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: SignupDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<UserDocument | null> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true },
      )
      .exec();
  }
}