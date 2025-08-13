import { Test, TestingModule } from '@nestjs/testing';
import { OfficeExpenseController } from './office-expense.controller';

describe('OfficeExpenseController', () => {
  let controller: OfficeExpenseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfficeExpenseController],
    }).compile();

    controller = module.get<OfficeExpenseController>(OfficeExpenseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
