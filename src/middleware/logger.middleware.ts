import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('API');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, headers } = req;
    const start = Date.now();

    this.logger.log(`Request: ${method} ${originalUrl}`);
    // this.logger.log(`Body: ${JSON.stringify(body, null, 2)}`);
    // this.logger.log(`Headers: ${JSON.stringify(headers, null, 2)}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`Response: ${method} ${originalUrl} ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}