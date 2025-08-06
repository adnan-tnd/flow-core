import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../schemas/attendance.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClockInOutDto {
  @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status', example: AttendanceStatus.CLOCKED_IN })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Optional notes for attendance', example: 'Late due to traffic' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttendanceReportDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2025-08-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', example: '2025-08-05' })
  @IsString()
  endDate: string;
}