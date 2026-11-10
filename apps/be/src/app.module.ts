import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@career-intelligence/database";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { RecruitersModule } from "./modules/recruiters/recruiters.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SeedModule } from "./modules/seed/seed.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { RbacGuard } from "./common/guards/rbac.guard";
import { WorkspaceScopeGuard } from "./common/guards/workspace-scope.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const uri =
          process.env.DATABASE_URL ||
          process.env.MONGODB_URI ||
          "mongodb://localhost:27017/career-intelligence-os";
        return {
          uri,
          maxPoolSize: 50,
          minPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: async (config: ConfigService) => {
        const secret = config.get<string>("JWT_ACCESS_SECRET");
        if (!secret || secret === "change-me-in-production") {
          throw new Error("JWT_ACCESS_SECRET must be configured");
        }
        return {
          secret,
          signOptions: { expiresIn: "15m" },
        };
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    CompaniesModule,
    RecruitersModule,
    JobsModule,
    AnalyticsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WorkspaceScopeGuard,
    },
  ],
})
export class AppModule {}
