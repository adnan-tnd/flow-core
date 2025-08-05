import { IsEnum, IsString, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from 'src/leave-request/types/leave-request';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, description: 'Type of leave (casual, sick, annual)' })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ description: 'Reason for the leave request', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ description: 'Number of leave days requested', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}