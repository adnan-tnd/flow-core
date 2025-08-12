import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { UserModule } from '../user/user.module';
import { SprintModule } from '../sprint/sprint.module';
import { MailModule } from '../mail/mail.module';
import { TrelloBoardModule } from '../trello-board/trello-board.module';
import { List, ListSchema } from '../trello-board/schemas/list.schema'; // Import List schema
import { Card, CardSchema } from '../trello-board/schemas/card.schema'; // Import Card schema

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: List.name, schema: ListSchema }, // Register List model
      { name: Card.name, schema: CardSchema }, // Register Card model
    ]),
    UserModule,
    MailModule,
    forwardRef(() => TrelloBoardModule),
    forwardRef(() => SprintModule),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}