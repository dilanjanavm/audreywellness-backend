import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode || 200;

        // If data is null or undefined, return empty response
        if (data === null || data === undefined) {
          return {
            statusCode,
            data: null as any,
          };
        }

        // If data is already wrapped in the expected format with statusCode, return it as is
        if (
          typeof data === 'object' &&
          'data' in data &&
          'statusCode' in data &&
          Object.keys(data).length === 2
        ) {
          return data as Response<T>;
        }

        // If data has a 'data' property, extract it (controller already wrapped it)
        if (typeof data === 'object' && 'data' in data) {
          return {
            statusCode,
            data: (data as any).data,
          };
        }

        // Otherwise, wrap the data directly
        return {
          statusCode,
          data: data,
        };
      }),
    );
  }
}
