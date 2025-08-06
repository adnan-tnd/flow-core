import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument, AttendanceStatus } from './schemas/attendance.schema';
import { LeaveRequest, LeaveRequestDocument } from '../leave-request/schemas/leave-request.schema';
import { LeaveStatus } from '../leave-request/types/leave-request';
import { ClockInOutDto, AttendanceReportDto } from './dto/attendance.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '../user/schemas/user.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async clockInOut(dto: ClockInOutDto, token: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const userId: string = payload.sub || payload.id;
      if (!userId) throw new UnauthorizedException('Invalid token');
      if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user ID');
      const userIdObj = new Types.ObjectId(userId);

      const requestingUser = await this.userService.findById(userId);
      if (!requestingUser) throw new UnauthorizedException('User not found');
      if (requestingUser.type === UserType.CEO) throw new ForbiddenException('You are not authorized to perform this action');

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const leave = await this.leaveRequestModel.findOne({
        userId: userIdObj,
        date: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1) },
        status: LeaveStatus.APPROVED,
      }).exec();
      if (leave) throw new BadRequestException('Cannot clock in on a day with an approved leave');

      let attendance: AttendanceDocument | null = await this.attendanceModel.findOne({ userId: userIdObj, date }).exec();
      if (!attendance) {
        attendance = new this.attendanceModel({
          userId: userIdObj,
          date,
          status: AttendanceStatus.CLOCKED_IN,
          sessions: [],
          workingHours: 0,
          notes: dto.notes,
        });
      }

      if (dto.status === AttendanceStatus.CLOCKED_IN) {
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        if (lastSession && !lastSession.clockOutTime) {
          throw new BadRequestException('Must clock out before starting a new session');
        }
        attendance.sessions.push({
          clockInTime: new Date(),
        });
        attendance.status = AttendanceStatus.CLOCKED_IN;
      } else if (dto.status === AttendanceStatus.CLOCKED_OUT) {
        const lastSession = attendance.sessions[attendance.sessions.length - 1];
        if (!lastSession || lastSession.clockOutTime) {
          throw new BadRequestException('Must clock in before clocking out');
        }
        lastSession.clockOutTime = new Date();
        lastSession.sessionHours = (lastSession.clockOutTime.getTime() - lastSession.clockInTime.getTime()) / (1000 * 60 * 60);
        if (lastSession.sessionHours < 0) {
          throw new BadRequestException('Invalid clock-out time');
        }
        attendance.workingHours = attendance.sessions.reduce((sum, session) => {
          return sum + (session.sessionHours || 0);
        }, 0);
        attendance.status = AttendanceStatus.CLOCKED_OUT;
      } else {
        throw new BadRequestException('Invalid attendance status');
      }

      await attendance.save();
      return { message: `Successfully ${dto.status === AttendanceStatus.CLOCKED_IN ? 'clocked in' : 'clocked out'}` };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getAttendanceReport(dto: AttendanceReportDto, token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const userId: string = payload.sub || payload.id;
      if (!userId) throw new UnauthorizedException('Invalid token');
      if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user ID');
      const userIdObj = new Types.ObjectId(userId);

      const requestingUser = await this.userService.findById(userId);
      if (!requestingUser) throw new UnauthorizedException('User not found');

      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999);

      const attendances = await this.attendanceModel
        .find({
          userId: userIdObj,
          date: { $gte: startDate, $lte: endDate },
        })
        .exec();

      const leaves = await this.leaveRequestModel
        .find({
          userId: userIdObj,
          date: { $gte: startDate, $lte: endDate },
          status: LeaveStatus.APPROVED,
        })
        .exec();

      const absentDays = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
      const approvedLeaveDays = leaves.length;

      return {
        attendances,
        absentDays,
        approvedLeaveDays,
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}