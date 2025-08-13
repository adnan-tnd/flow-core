import { Body, Controller, Post, Get, Patch, Delete, Param, Request, UseGuards, UnauthorizedException, BadRequestException, Query } from '@nestjs/common';
import { OfficeExpenseService } from './office-expense.service';
import { CreateSalaryDto, UpdateSalaryDto, CreateOfficeExpenseDto, UpdateOfficeExpenseDto, SalaryQueryDto, ExpenseQueryDto } from './dto/office-expense.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserType } from 'src/user/types/user';

@ApiTags('office-expense')
@ApiBearerAuth('JWT')
@Controller('office-expense')
export class OfficeExpenseController {
  constructor(private readonly officeExpenseService: OfficeExpenseService) {}

  @Post('salary/create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new salary record (CEO/Manager only)' })
  @ApiResponse({ status: 201, description: 'Salary record created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createSalary(@Body() dto: CreateSalaryDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can create salary records');
    }
    return this.officeExpenseService.createSalary(dto, req.user.sub);
  }

  @Patch('salary/update/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a salary record (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Salary record updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'id', description: 'Salary record ID', type: String })
  async updateSalary(@Param('id') id: string, @Body() dto: UpdateSalaryDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can update salary records');
    }
    return this.officeExpenseService.updateSalary(id, dto, req.user.sub);
  }

  @Delete('salary/delete/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a salary record (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Salary record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'id', description: 'Salary record ID', type: String })
  async deleteSalary(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can delete salary records');
    }
    return this.officeExpenseService.deleteSalary(id, req.user.sub);
  }

  @Get('salaries')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all salary records with optional filters (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all salary records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Only CEO or Manager can view all salaries' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'month', required: false, description: 'Filter by month (YYYY-MM)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  async findAllSalaries(@Query() query: SalaryQueryDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can view all salaries');
    }
    return this.officeExpenseService.findAllSalaries(query, req.user.sub);
  }

  @Get('salaries/my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get salary records for the current user' })
  @ApiResponse({ status: 200, description: 'List of user salary records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findUserSalaries(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.officeExpenseService.findUserSalaries(req.user.sub);
  }

  @Post('expense/create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new office expense record (CEO/Manager only)' })
  @ApiResponse({ status: 201, description: 'Expense record created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createOfficeExpense(@Body() dto: CreateOfficeExpenseDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can create expense records');
    }
    return this.officeExpenseService.createOfficeExpense(dto, req.user.sub);
  }

  @Patch('expense/update/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an office expense record (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Expense record updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'id', description: 'Expense record ID', type: String })
  async updateOfficeExpense(@Param('id') id: string, @Body() dto: UpdateOfficeExpenseDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can update expense records');
    }
    return this.officeExpenseService.updateOfficeExpense(id, dto, req.user.sub);
  }

  @Delete('expense/delete/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an office expense record (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Expense record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiParam({ name: 'id', description: 'Expense record ID', type: String })
  async deleteOfficeExpense(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can delete expense records');
    }
    return this.officeExpenseService.deleteOfficeExpense(id, req.user.sub);
  }

  @Get('expenses')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all office expense records with optional filters (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'List of all expense records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Only CEO or Manager can view all expenses' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by expense type' })
  @ApiQuery({ name: 'createdBy', required: false, description: 'Filter by creator user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  async findAllExpenses(@Query() query: ExpenseQueryDto, @Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can view all expenses');
    }
    return this.officeExpenseService.findAllExpenses(query, req.user.sub);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get expense statistics (CEO/Manager only)' })
  @ApiResponse({ status: 200, description: 'Expense statistics fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Only CEO or Manager can view expense stats' })
  async getExpenseStats(@Request() req) {
    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!req.user || ![UserType.CEO, UserType.MANAGER].includes(req.user.type)) {
      throw new BadRequestException('Only CEO or Manager can view expense stats');
    }
    return this.officeExpenseService.getExpenseStats(req.user.sub);
  }
}