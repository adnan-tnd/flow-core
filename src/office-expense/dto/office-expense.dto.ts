import { IsString, IsNumber, Min, IsDateString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalaryDto {
  @ApiProperty({ description: 'User ID for whom the salary is recorded' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Salary amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Month of the salary (format: YYYY-MM)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month: string;

  @ApiProperty({ description: 'Tax amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ description: 'Bonus amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiProperty({ description: 'Optional notes for the salary', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSalaryDto {
  @ApiProperty({ description: 'User ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Salary amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ description: 'Month of the salary (format: YYYY-MM)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month?: string;

  @ApiProperty({ description: 'Tax amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ description: 'Bonus amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiProperty({ description: 'Optional notes for the salary', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateOfficeExpenseDto {
  @ApiProperty({ description: 'Type of expense' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Expense amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Description of the expense' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Date of the expense (ISO format)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Optional notes for the expense', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateOfficeExpenseDto {
  @ApiProperty({ description: 'Type of expense', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Expense amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ description: 'Description of the expense', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Date of the expense (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Optional notes for the expense', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SalaryQueryDto {
  @ApiProperty({ description: 'Filter by user ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Filter by month (YYYY-MM)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month?: string;

  @ApiProperty({ description: 'Filter by start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Filter by end date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ExpenseQueryDto {
  @ApiProperty({ description: 'Filter by expense type', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Filter by creator user ID', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ description: 'Filter by start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Filter by end date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}