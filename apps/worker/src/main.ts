/**
 * Worker application entry point.
 *
 * Bootstraps a NestJS application that consumes BullMQ queues for
 * asynchronous workloads (research, email dispatch, mailbox sync, etc.).
 */

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor(), new LoggingInterceptor());

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    // eslint-disable-next-line no-console
    console.log("[worker] SIGTERM received, shutting down gracefully");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    // eslint-disable-next-line no-console
    console.log("[worker] SIGINT received, shutting down gracefully");
    await app.close();
    process.exit(0);
  });

  await app.listen(4001, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Career Intelligence OS Worker listening on :4001`);
}

bootstrap();
