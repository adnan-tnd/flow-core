import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { LoggerModule } from './middleware/logger.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ProjectModule } from './project/project.module';
import { SprintModule } from './sprint/sprint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/flow-core'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    MailModule,
    LoggerModule,
    LeaveRequestModule,
    AttendanceModule,
    ProjectModule,
    SprintModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}