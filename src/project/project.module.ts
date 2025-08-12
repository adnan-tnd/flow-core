import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { UserModule } from '../user/user.module';
import { SprintModule } from '../sprint/sprint.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    UserModule,
    MailModule,
    forwardRef(() => SprintModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}