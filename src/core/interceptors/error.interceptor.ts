/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    return next.handle().pipe(
      catchError((error) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (error instanceof HttpException) {
          status = error.getStatus();
          const response = error.getResponse();
          message =
            typeof response === 'string'
              ? response
              : response['message'] || message;
        }

        // {
        //   "statusCode": 404,
        //   "message": "User with ID 123 not found",
        //   "timestamp": "2023-07-25T12:34:56.789Z",
        //   "path": "/users/123"
        // }
        const errorResponse: ErrorResponse = {
          statusCode: status,
          message,
          timestamp: new Date().toISOString(),
          path,
        };

        return throwError(() => new HttpException(errorResponse, status));
      }),
    );
  }
}
