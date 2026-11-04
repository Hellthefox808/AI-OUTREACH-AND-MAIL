/**
 * Worker module.
 *
 * Registers BullMQ queue processors for background workloads.
 * Queue definitions live in src/queues/, processors in src/processors/.
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@career-intelligence/database";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./modules/health/health.module";
import { QueuesModule } from "./modules/queues/queues.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    DatabaseModule,
    HealthModule,
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
