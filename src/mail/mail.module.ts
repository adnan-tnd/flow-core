import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
          port: configService.get<number>('SMTP_PORT', 587),
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"Your App" <your-email@your-domain.com>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}