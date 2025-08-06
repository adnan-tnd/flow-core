import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './schemas/leave-request.schema';
import {LeaveStatus} from 'src/leave-request/types/leave-request';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { UserType } from 'src/user/types/user';


@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async createLeaveRequest(dto: CreateLeaveRequestDto, token: string): Promise<{ message: string }> {
    try {
      // Verify and decode JWT token to get user ID
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Fetch the requesting user
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Calculate total approved leave days for the user
      const approvedLeaves = await this.leaveRequestModel
        .find({ userId, status: LeaveStatus.APPROVED })
        .exec();
      const totalApprovedDays = approvedLeaves.reduce((sum, leave) => sum + leave.quantity, 0);

      // Determine leave status based on quantity and total approved days
      let status = LeaveStatus.PENDING;
      if (totalApprovedDays < 20 && dto.quantity <= 2) {
        status = LeaveStatus.APPROVED; // Auto-approve if quantity <= 2 and total < 20
      }

      // Create the leave request
      const leaveRequest = new this.leaveRequestModel({
        userId,
        type: dto.type,
        status,
        reason: dto.reason,
        quantity: dto.quantity,
      });
      await leaveRequest.save();

      // Fetch recipients based on user role
      let recipients: string[] = [];
      if (user.type === UserType.MEMBER) {
        // Send to all CEOs and Managers
        const managersAndCeos = await this.userService.findByRoles([UserType.CEO, UserType.MANAGER]);
        recipients = managersAndCeos.map((u) => u.email);
      } else if (user.type === UserType.MANAGER) {
        // Send only to CEOs
        const ceos = await this.userService.findByRoles([UserType.CEO]);
        recipients = ceos.map((u) => u.email);
      }

      // Send email to recipients (for both pending and approved statuses)
      if (recipients.length > 0) {
        for (const email of recipients) {
          await this.mailService.sendMail({
            to: email,
            subject: `${dto.type.charAt(0).toUpperCase() + dto.type.slice(1)} Leave Request`,
            text: `A new ${dto.type} leave request has been submitted by ${user.name} (${user.email}).\n\nReason: ${dto.reason}\nQuantity: ${dto.quantity} day(s)\nStatus: ${status}`,
          });
        }
      }

      return { message: `Leave request ${status === LeaveStatus.APPROVED ? 'approved' : 'created'} successfully` };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getUserLeaves(token: string): Promise<{ leaves: LeaveRequestDocument[]; totalApprovedLeave: number; totalRequestedLeave: number }> {
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid token');
      }

      const leaves = await this.leaveRequestModel.find({ userId }).exec();

      const totalApprovedLeave = leaves
        .filter((leave) => leave.status === LeaveStatus.APPROVED)
        .reduce((sum, leave) => sum + leave.quantity, 0);

      // Calculate total requested leave days
      const totalRequestedLeave = leaves.reduce((sum, leave) => sum + leave.quantity, 0);

      return {
        leaves,
        totalApprovedLeave,
        totalRequestedLeave,
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateLeaveStatus(
    leaveId: string,
    dto: UpdateLeaveRequestDto,
    token: string,
  ): Promise<{ message: string }> {
    try {
      if (!Types.ObjectId.isValid(leaveId)) {
        throw new BadRequestException('Invalid leave request ID');
      }

      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid token');
      }

      const requestingUser = await this.userService.findById(userId);
      if (!requestingUser) {
        throw new UnauthorizedException('User not found');
      }

      const leaveRequest = await this.leaveRequestModel.findById(leaveId).exec();
      if (!leaveRequest) {
        throw new BadRequestException('Leave request not found');
      }

      if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new ForbiddenException('You are not able to approve this leave');
      }

      const leaveUser = await this.userService.findById(leaveRequest.userId.toString());
      if (!leaveUser) {
        throw new BadRequestException('Leave request owner not found');
      }

      if (leaveUser.type === UserType.MEMBER) {
        if (requestingUser.type !== UserType.CEO && requestingUser.type !== UserType.MANAGER) {
          throw new ForbiddenException('You are not able to approve this leave');
        }
      } else if (leaveUser.type === UserType.MANAGER) {
        if (requestingUser.type !== UserType.CEO) {
          throw new ForbiddenException('You are not able to approve this leave');
        }
      } else if (leaveUser.type === UserType.CEO) {
        throw new ForbiddenException('You are not able to approve this leave');
      }

      if (leaveRequest.userId.toString() === userId) {
        throw new ForbiddenException('You are not able to approve this leave');
      }

      leaveRequest.status = dto.status;
      await leaveRequest.save();

      if (dto.status === LeaveStatus.APPROVED || dto.status === LeaveStatus.REJECTED) {
        await this.mailService.sendMail({
          to: leaveUser.email,
          subject: `Your ${leaveRequest.type.charAt(0).toUpperCase() + leaveRequest.type.slice(1)} Leave Request`,
          text: `Your leave request for ${leaveRequest.quantity} day(s) has been ${dto.status}.`,
        });
      }

      return { message: `Leave request status updated to ${dto.status}` };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}