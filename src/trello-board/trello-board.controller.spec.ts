import { Test, TestingModule } from '@nestjs/testing';
import { TrelloBoardController } from './trello-board.controller';

describe('TrelloBoardController', () => {
  let controller: TrelloBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrelloBoardController],
    }).compile();

    controller = module.get<TrelloBoardController>(TrelloBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
