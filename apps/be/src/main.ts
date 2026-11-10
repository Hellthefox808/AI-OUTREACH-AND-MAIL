import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
  type VersioningOptions,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { validateEnv } from './config/env.schema';

async function bootstrap() {
  // Validate environment before starting — fail fast with actionable errors
  validateEnv(process.env);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Trust proxy for rate limiting and IP-based security behind load balancers
  (app as any).set("trust proxy", 1);

  const globalPrefix = 'v1';
  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  } as VersioningOptions);

  // CSP and security headers via helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // Global rate limiting
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
        timestamp: new Date().toISOString(),
      },
    }),
  );

  // Auth-specific stricter rate limiting
  app.use(
    '/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 auth requests per 15 minutes per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication requests, please try again later.',
        timestamp: new Date().toISOString(),
      },
    }),
  );

  // Cookie parsing for HTTP-only JWT session and CSRF tokens
  app.use(cookieParser());

  // CORS — tightened in production via ALLOWED_ORIGINS env
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  });

  // CSRF protection (double-submit cookie)
  app.use(new CsrfMiddleware().use.bind(new CsrfMiddleware()));

  // Global pipes / filters / interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor(), new LoggingInterceptor());

  // OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Career Intelligence OS API')
    .setDescription('Company research, recruiter discovery, outreach automation.')
    .setVersion('v1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Career Intelligence OS API listening on :${port}`);
}

bootstrap();
