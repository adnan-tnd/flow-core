import { Test, TestingModule } from '@nestjs/testing';
import { OfficeExpenseService } from './office-expense.service';

describe('OfficeExpenseService', () => {
  let service: OfficeExpenseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfficeExpenseService],
    }).compile();

    service = module.get<OfficeExpenseService>(OfficeExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
