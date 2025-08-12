import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { UserModule } from '../user/user.module';
import { SprintModule } from '../sprint/sprint.module';
import { MailModule } from '../mail/mail.module';
import { TrelloBoardModule } from '../trello-board/trello-board.module'; // ✅ Import the module, not the service

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    UserModule,
    MailModule,
    forwardRef(() => TrelloBoardModule), // ✅ Fixed
    forwardRef(() => SprintModule), // ✅ Still using forwardRef for circular deps
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
