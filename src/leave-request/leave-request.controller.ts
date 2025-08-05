import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get, Patch, Param } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('leave-request')
@Controller('leave-request')
export class LeaveRequestController {
  constructor(private leaveRequestService: LeaveRequestService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiResponse({ status: 201, description: 'Leave request created or approved successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLeaveRequestDto, @Request() req) {
    return this.leaveRequestService.createLeaveRequest(dto, req.headers.authorization);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all leave requests for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user leave requests with total approved and requested leave days' })
  async getUserLeaves(@Request() req) {
    return this.leaveRequestService.getUserLeaves(req.headers.authorization);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update the status of a leave request' })
  @ApiResponse({ status: 200, description: 'Leave request status updated successfully' })
  @ApiResponse({ status: 403, description: 'Unauthorized to update this leave request' })
  @ApiResponse({ status: 400, description: 'Leave request is already approved and cannot be updated' })
  async updateLeaveStatus(@Param('id') id: string, @Body() dto: UpdateLeaveRequestDto, @Request() req) {
    return this.leaveRequestService.updateLeaveStatus(id, dto, req.headers.authorization);
  }
}