/**
 * Request ID interceptor for the worker.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId =
      request.headers["x-request-id"] ||
      request.headers["x-correlation-id"] ||
      crypto.randomUUID();
    request.requestId = requestId;
    return next.handle();
  }
}
