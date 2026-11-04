/**
 * Seed module.
 *
 * Registers the SeedService which ensures default permissions and roles
 * exist for every workspace.
 */

import { Module } from "@nestjs/common";
import { DatabaseModule } from "@career-intelligence/database";
import { SeedService } from "./seed.service";

@Module({
  imports: [DatabaseModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
