import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrelloBoard, TrelloBoardSchema } from './schemas/trello-board.schema';
import { List, ListSchema } from './schemas/list.schema';
import { TrelloBoardService } from './trello-board.service';
import { TrelloBoardController } from './trello-board.controller';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrelloBoard.name, schema: TrelloBoardSchema },
      { name: List.name, schema: ListSchema },
    ]),
    UserModule,
    MailModule,
  ],
  controllers: [TrelloBoardController],
  providers: [TrelloBoardService],
  exports: [TrelloBoardService],
})
export class TrelloBoardModule {}