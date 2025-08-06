import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sprint, SprintSchema } from './schemas/sprint.schema';
import { SprintService } from './sprint.service';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sprint.name, schema: SprintSchema }]),
    UserModule,
    forwardRef(() => ProjectModule), // Use forwardRef to avoid circular dependency
  ],
  providers: [SprintService],
  exports: [SprintService],
})
export class SprintModule {}