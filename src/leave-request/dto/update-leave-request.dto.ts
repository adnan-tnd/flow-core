import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeaveStatus } from 'src/leave-request/types/leave-request';

export class UpdateLeaveRequestDto {
  @ApiProperty({ enum: LeaveStatus, description: 'Status of the leave request (pending, approved, rejected)' })
  @IsEnum(LeaveStatus)
  status: LeaveStatus;
}