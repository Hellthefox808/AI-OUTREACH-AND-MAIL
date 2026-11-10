/**
 * Queues module.
 *
 * Sets up BullMQ queue connections with defined options and registers
 * processors. Queue names and options come from the central registry.
 */

import { Module, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { QUEUE_NAMES } from "../../config/queues";
import { QueueProcessorsModule } from "./processors.module";

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>("REDIS_URL") || "redis://localhost:6379",
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(...QUEUE_NAMES.map((name) => ({ name }))),
    QueueProcessorsModule,
  ],
  providers: [],
  exports: [BullModule, QueueProcessorsModule],
})
export class QueuesModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuesModule.name);

  onModuleInit() {
    this.logger.log(`Worker queues registered: ${QUEUE_NAMES.join(", ")}`);
  }

  onModuleDestroy() {
    this.logger.log("Worker queues shutting down");
  }
}
