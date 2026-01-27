// src/common/middleware/request-logger.middleware.ts
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params } = req;
    const startTime = Date.now();

    // Log request
    this.logger.log(`${method} ${originalUrl}`);
    
    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body, null, 2)}`);
    }
    
    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(`Request Query: ${JSON.stringify(query)}`);
    }
    
    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(`Request Params: ${JSON.stringify(params)}`);
    }

    // Log response
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      
      if (statusCode >= 400) {
        this.logger.warn(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      } else {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      }
    });

    next();
  }
}

