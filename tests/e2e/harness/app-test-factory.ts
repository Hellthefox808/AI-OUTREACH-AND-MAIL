/**
 * NestJS Application Test Factory for E2E Tests.
 *
 * Boots a real, fully-wired NestJS HTTP application on a dynamic loopback port
 * using explicit factory injection to guarantee deterministic execution across all
 * bundlers and environments without requiring esbuild decorator metadata plugins.
 */

import "reflect-metadata";

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { APP_GUARD, Reflector } from "@nestjs/core";
import cookieParser from "cookie-parser";

import { InMemoryStateEngine } from "./in-memory-db";
import { TestHttpClient } from "./http-client";
import { TEST_CONFIG } from "../config/test-env";

import { HealthController } from "../../../apps/be/src/modules/health/health.controller";
import { HealthService } from "../../../apps/be/src/modules/health/health.service";
import { AuthController } from "../../../apps/be/src/modules/auth/auth.controller";
import { AuthService } from "../../../apps/be/src/modules/auth/auth.service";
import { UsersController } from "../../../apps/be/src/modules/users/users.controller";
import { UsersService } from "../../../apps/be/src/modules/users/users.service";
import { WorkspacesController } from "../../../apps/be/src/modules/workspaces/workspaces.controller";
import { WorkspacesService } from "../../../apps/be/src/modules/workspaces/workspaces.service";
import { CompaniesController } from "../../../apps/be/src/modules/companies/companies.controller";
import { CompaniesService } from "../../../apps/be/src/modules/companies/companies.service";
import { RecruitersController } from "../../../apps/be/src/modules/recruiters/recruiters.controller";
import { RecruitersService } from "../../../apps/be/src/modules/recruiters/recruiters.service";
import { JobsController } from "../../../apps/be/src/modules/jobs/jobs.controller";
import { JobsService } from "../../../apps/be/src/modules/jobs/jobs.service";
import { SeedService } from "../../../apps/be/src/modules/seed/seed.service";

import { AuthGuard } from "../../../apps/be/src/common/guards/auth.guard";
import { RbacGuard } from "../../../apps/be/src/common/guards/rbac.guard";
import { WorkspaceScopeGuard } from "../../../apps/be/src/common/guards/workspace-scope.guard";
import { HttpExceptionFilter } from "../../../apps/be/src/common/filters/http-exception.filter";
import { CsrfMiddleware } from "../../../apps/be/src/common/middleware/csrf.middleware";

import {
  UserRepository,
  SessionRepository,
  WorkspaceRepository,
  MembershipRepository,
  RoleRepository,
  PermissionRepository,
  CompanyRepository,
  RecruiterRepository,
  JobRepository,
} from "./database-mock";

export interface TestAppInstance {
  app: INestApplication;
  baseUrl: string;
  client: TestHttpClient;
  stateEngine: InMemoryStateEngine;
  close: () => Promise<void>;
}

export async function createE2ETestApp(): Promise<TestAppInstance> {
  const stateEngine = new InMemoryStateEngine();

  const userRepo = stateEngine.createUserRepo();
  const sessionRepo = stateEngine.createSessionRepo();
  const workspaceRepo = stateEngine.createWorkspaceRepo();
  const membershipRepo = stateEngine.createMembershipRepo();
  const roleRepo = stateEngine.createRoleRepo();
  const permissionRepo = stateEngine.createPermissionRepo();
  const companyRepo = stateEngine.createCompanyRepo();
  const recruiterRepo = stateEngine.createRecruiterRepo();
  const jobRepo = stateEngine.createJobRepo();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [
          () => ({
            JWT_ACCESS_SECRET: TEST_CONFIG.JWT_ACCESS_SECRET,
            JWT_REFRESH_SECRET: TEST_CONFIG.JWT_REFRESH_SECRET,
            NODE_ENV: TEST_CONFIG.NODE_ENV,
          }),
        ],
      }),
      JwtModule.registerAsync({
        global: true,
        useFactory: async (config: ConfigService) => ({
          secret: config.get<string>("JWT_ACCESS_SECRET") || TEST_CONFIG.JWT_ACCESS_SECRET,
          signOptions: { expiresIn: "15m" },
        }),
        inject: [ConfigService],
      }),
    ],
    controllers: [
      HealthController,
      AuthController,
      UsersController,
      WorkspacesController,
      CompaniesController,
      RecruitersController,
      JobsController,
    ],
    providers: [
      Reflector,
      // Repositories
      { provide: UserRepository, useValue: userRepo },
      { provide: SessionRepository, useValue: sessionRepo },
      { provide: WorkspaceRepository, useValue: workspaceRepo },
      { provide: MembershipRepository, useValue: membershipRepo },
      { provide: RoleRepository, useValue: roleRepo },
      { provide: PermissionRepository, useValue: permissionRepo },
      { provide: CompanyRepository, useValue: companyRepo },
      { provide: RecruiterRepository, useValue: recruiterRepo },
      { provide: JobRepository, useValue: jobRepo },

      // Services with explicit dependency wiring
      {
        provide: HealthService,
        useFactory: () => new HealthService(),
      },
      {
        provide: SeedService,
        useFactory: (w: any, p: any, r: any) => new SeedService(w, p, r),
        inject: [WorkspaceRepository, PermissionRepository, RoleRepository],
      },
      {
        provide: AuthService,
        useFactory: (
          u: any,
          s: any,
          w: any,
          m: any,
          r: any,
          p: any,
          sd: any,
          j: any,
          c: any
        ) => new AuthService(u, s, w, m, r, p, sd, j, c),
        inject: [
          UserRepository,
          SessionRepository,
          WorkspaceRepository,
          MembershipRepository,
          RoleRepository,
          PermissionRepository,
          SeedService,
          JwtService,
          ConfigService,
        ],
      },
      {
        provide: UsersService,
        useFactory: (u: any) => new UsersService(u),
        inject: [UserRepository],
      },
      {
        provide: WorkspacesService,
        useFactory: (w: any, m: any, s: any) => new WorkspacesService(w, m, s),
        inject: [WorkspaceRepository, MembershipRepository, SeedService],
      },
      {
        provide: CompaniesService,
        useFactory: (c: any) => new CompaniesService(c),
        inject: [CompanyRepository],
      },
      {
        provide: RecruitersService,
        useFactory: (r: any) => new RecruitersService(r),
        inject: [RecruiterRepository],
      },
      {
        provide: JobsService,
        useFactory: (j: any) => new JobsService(j),
        inject: [JobRepository],
      },

      // Guards with explicit dependency wiring
      {
        provide: APP_GUARD,
        useFactory: (
          reflector: Reflector,
          jwt: JwtService,
          config: ConfigService,
          auth: AuthService
        ) => new AuthGuard(reflector, jwt, config, auth),
        inject: [Reflector, JwtService, ConfigService, AuthService],
      },
      {
        provide: APP_GUARD,
        useFactory: (reflector: Reflector) => new RbacGuard(reflector),
        inject: [Reflector],
      },
      {
        provide: APP_GUARD,
        useFactory: (reflector: Reflector) => new WorkspaceScopeGuard(reflector),
        inject: [Reflector],
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix("v1");
  app.use(cookieParser());
  app.use(new CsrfMiddleware().use.bind(new CsrfMiddleware()));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(0, "127.0.0.1");

  const address = app.getHttpServer().address();
  const port = typeof address === "string" ? address : address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new TestHttpClient(baseUrl);

  return {
    app,
    baseUrl,
    client,
    stateEngine,
    close: async () => {
      await app.close();
    },
  };
}
