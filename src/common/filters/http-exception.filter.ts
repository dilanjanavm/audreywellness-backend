// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as any).message || message;

    // Log the error
    const logMessage = `${request.method} ${request.url} - ${status} - ${errorMessage}`;
    
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : '');
      this.logger.error(`Request body: ${JSON.stringify(request.body)}`);
      this.logger.error(`Request query: ${JSON.stringify(request.query)}`);
      this.logger.error(`Request params: ${JSON.stringify(request.params)}`);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
      this.logger.debug(`Request body: ${JSON.stringify(request.body)}`);
      this.logger.debug(`Request query: ${JSON.stringify(request.query)}`);
      this.logger.debug(`Request params: ${JSON.stringify(request.params)}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
    });
  }
}
