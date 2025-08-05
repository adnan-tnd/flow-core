import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LeaveRequest.name, schema: LeaveRequestSchema }]),
    UserModule,
    MailModule,
    AuthModule,
  ],
  providers: [LeaveRequestService],
  controllers: [LeaveRequestController],
})
export class LeaveRequestModule {}