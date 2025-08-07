import { Test, TestingModule } from '@nestjs/testing';
import { TrelloBoardService } from './trello-board.service';

describe('TrelloBoardService', () => {
  let service: TrelloBoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrelloBoardService],
    }).compile();

    service = module.get<TrelloBoardService>(TrelloBoardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
