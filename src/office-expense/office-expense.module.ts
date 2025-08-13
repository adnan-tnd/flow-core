import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OfficeExpenseService } from './office-expense.service';
import { OfficeExpenseController } from './office-expense.controller';
import { Salary, SalarySchema } from './schemas/salary.schema';
import { OfficeExpense, OfficeExpenseSchema } from './schemas/office-expense.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Salary.name, schema: SalarySchema },
      { name: OfficeExpense.name, schema: OfficeExpenseSchema },
    ]),
    UserModule, // Required for UserService dependency
  ],
  controllers: [OfficeExpenseController],
  providers: [OfficeExpenseService],
})
export class OfficeExpenseModule {}