import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ClockInOutDto, AttendanceReportDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('inroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Clock in or out for an employee' })
  @ApiResponse({ status: 200, description: 'Successfully clocked in or out' })
  @ApiResponse({ status: 400, description: 'Invalid request or user ID' })
  @ApiResponse({ status: 403, description: 'Unauthorized to perform this action' })
  @HttpCode(HttpStatus.OK)
  async clockInOut(@Body() dto: ClockInOutDto, @Request() req) {
    return this.attendanceService.clockInOut(dto, req.headers.authorization);
  }

  @Post('myreport')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get attendance report for a user' })
  @ApiResponse({ status: 200, description: 'Attendance report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user ID or date range' })
  @ApiResponse({ status: 403, description: 'Unauthorized to view this report' })
  @HttpCode(HttpStatus.OK)
  async getAttendanceReport(@Body() dto: AttendanceReportDto, @Request() req) {
    return this.attendanceService.getAttendanceReport(dto, req.headers.authorization);
  }
}