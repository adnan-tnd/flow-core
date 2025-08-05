import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';

@Module({
  providers: [LoggerMiddleware],
  exports: [LoggerMiddleware],
})
export class LoggerModule {}