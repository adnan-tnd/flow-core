import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Salary, SalaryDocument } from './schemas/salary.schema';
import { OfficeExpense, OfficeExpenseDocument } from './schemas/office-expense.schema';
import { CreateSalaryDto, UpdateSalaryDto, CreateOfficeExpenseDto, UpdateOfficeExpenseDto, SalaryQueryDto, ExpenseQueryDto } from './dto/office-expense.dto';
import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/types/user';

@Injectable()
export class OfficeExpenseService {
  constructor(
    @InjectModel(Salary.name)
    private salaryModel: Model<SalaryDocument>,
    @InjectModel(OfficeExpense.name)
    private officeExpenseModel: Model<OfficeExpenseDocument>,
    private userService: UserService,
  ) {}

  async createSalary(dto: CreateSalaryDto, userId: string): Promise<SalaryDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can create salary records');
      }

      const targetUser = await this.userService.findById(dto.userId);
      if (!targetUser) {
        throw new BadRequestException('Invalid user ID');
      }

      const existingSalary = await this.salaryModel.findOne({ user: dto.userId, month: dto.month });
      if (existingSalary) {
        throw new BadRequestException(`Salary record for ${dto.month} already exists for this user`);
      }

      const salary = new this.salaryModel({
        user: new Types.ObjectId(dto.userId),
        amount: dto.amount,
        month: dto.month,
        tax: dto.tax || 0,
        bonus: dto.bonus || 0,
        notes: dto.notes || '',
        metadata: dto.metadata || {},
      });

      return await salary.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateSalary(id: string, dto: UpdateSalaryDto, userId: string): Promise<SalaryDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can update salary records');
      }

      const salary = await this.salaryModel.findById(id);
      if (!salary) {
        throw new BadRequestException('Salary record not found');
      }

      if (dto.userId) {
        const targetUser = await this.userService.findById(dto.userId);
        if (!targetUser) {
          throw new BadRequestException('Invalid user ID');
        }
        salary.user = new Types.ObjectId(dto.userId);
      }

      Object.keys(dto).forEach((key) => {
        if (dto[key] !== undefined && key !== 'userId') {
          salary[key] = dto[key];
        }
      });

      if (dto.month) {
        const existingSalary = await this.salaryModel.findOne({
          user: salary.user,
          month: dto.month,
          _id: { $ne: id },
        });
        if (existingSalary) {
          throw new BadRequestException(`Salary record for ${dto.month} already exists for this user`);
        }
      }

      return await salary.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteSalary(id: string, userId: string): Promise<{ message: string }> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can delete salary records');
      }

      const salary = await this.salaryModel.findByIdAndDelete(id);
      if (!salary) {
        throw new BadRequestException('Salary record not found');
      }

      return { message: 'Salary record deleted successfully' };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAllSalaries(query: SalaryQueryDto, userId: string): Promise<SalaryDocument[]> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view all salary records');
      }

      const filter: any = {};
      if (query.userId) {
        filter.user = new Types.ObjectId(query.userId);
      }
      if (query.month) {
        filter.month = query.month;
      }
      if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
      }

      return await this.salaryModel
        .find(filter)
        .populate('user', 'name email')
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findUserSalaries(userId: string): Promise<SalaryDocument[]> {
    try {
      return await this.salaryModel
        .find({ user: new Types.ObjectId(userId) })
        .populate('user', 'name email')
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async createOfficeExpense(dto: CreateOfficeExpenseDto, userId: string): Promise<OfficeExpenseDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can create expense records');
      }

      const expense = new this.officeExpenseModel({
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        createdBy: new Types.ObjectId(userId),
        notes: dto.notes || '',
        metadata: dto.metadata || {},
      });

      return await expense.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async updateOfficeExpense(id: string, dto: UpdateOfficeExpenseDto, userId: string): Promise<OfficeExpenseDocument> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can update expense records');
      }

      const expense = await this.officeExpenseModel.findById(id);
      if (!expense) {
        throw new BadRequestException('Expense record not found');
      }

      Object.keys(dto).forEach((key) => {
        if (dto[key] !== undefined) {
          expense[key] = key === 'date' ? new Date(dto[key]) : dto[key];
        }
      });

      return await expense.save();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteOfficeExpense(id: string, userId: string): Promise<{ message: string }> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can delete expense records');
      }

      const expense = await this.officeExpenseModel.findByIdAndDelete(id);
      if (!expense) {
        throw new BadRequestException('Expense record not found');
      }

      return { message: 'Expense record deleted successfully' };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAllExpenses(query: ExpenseQueryDto, userId: string): Promise<OfficeExpenseDocument[]> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view all expense records');
      }

      const filter: any = {};
      if (query.type) {
        filter.type = query.type;
      }
      if (query.createdBy) {
        filter.createdBy = new Types.ObjectId(query.createdBy);
      }
      if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = new Date(query.startDate);
        if (query.endDate) filter.date.$lte = new Date(query.endDate);
      }

      return await this.officeExpenseModel
        .find(filter)
        .populate('createdBy', 'name email')
        .exec();
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async getExpenseStats(userId: string): Promise<{
    totalSalaries: number;
    totalExpenses: number;
    monthlyBreakdown: Array<{ month: string; totalSalaries: number; totalExpenses: number; byType: Record<string, number> }>;
  }> {
    try {
      const user = await this.userService.findById(userId);
      if (!user || ![UserType.CEO, UserType.MANAGER].includes(user.type)) {
        throw new UnauthorizedException('Only CEO or Manager can view expense stats');
      }

      // Calculate total salaries
      const salaries = await this.salaryModel.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      // Calculate total expenses
      const expenses = await this.officeExpenseModel.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      // Log all expenses to verify date fields
      const allExpenses = await this.officeExpenseModel.find().lean();
      console.log('All expenses:', allExpenses);

      // Get unique months from both salaries and expenses
      const salaryMonths = await this.salaryModel.distinct('month');
      const expenseMonths = await this.officeExpenseModel.aggregate([
        {
          $project: {
            month: { $dateToString: { format: '%Y-%m', date: { $toDate: '$date' } } },
          },
        },
        { $group: { _id: '$month' } },
      ]);
      const allMonths = [...new Set([...salaryMonths, ...expenseMonths.map(e => e._id)])].sort();

      // Aggregate monthly breakdown with byType
      const monthlyBreakdown = await Promise.all(
        allMonths.map(async (month) => {
          const salaryAgg = await this.salaryModel.aggregate([
            { $match: { month } },
            { $group: { _id: null, totalSalaries: { $sum: '$amount' } } },
          ]);

          const expenseAgg = await this.officeExpenseModel.aggregate([
            {
              $match: {
                $expr: {
                  $eq: [
                    { $dateToString: { format: '%Y-%m', date: { $toDate: '$date' } } },
                    month,
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
              },
            },
          ]);

          const byType = expenseAgg.reduce((acc, exp) => {
            acc[exp._id] = exp.total;
            return acc;
          }, {} as Record<string, number>);

          const totalExpenses = expenseAgg.reduce((sum, exp) => sum + exp.total, 0);

          return {
            month,
            totalSalaries: salaryAgg[0]?.totalSalaries || 0,
            totalExpenses: totalExpenses || 0,
            byType,
          };
        }),
      );

      console.log('Salaries aggregation:', salaries);
      console.log('Expenses aggregation:', expenses);
      console.log('All months:', allMonths);
      console.log('Monthly breakdown raw:', monthlyBreakdown);

      const totalSalaries = salaries[0]?.total || 0;
      const totalExpenses = expenses[0]?.total || 0;

      return {
        totalSalaries,
        totalExpenses,
        monthlyBreakdown: monthlyBreakdown.sort((a, b) => a.month.localeCompare(b.month)),
      };
    } catch (err) {
      console.error('Error in getExpenseStats:', err);
      throw new BadRequestException(err.message);
    }
  }
}