import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthService } from "./health.service";
import { Public, WorkspaceAgnostic } from "../../common/decorators";

@ApiTags("health")
@Controller("health")
@Public()
@WorkspaceAgnostic()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Readiness health check" })
  @ApiResponse({ status: 200, description: "System is ready and connected" })
  readiness() {
    return this.health.readiness();
  }

  @Get("liveness")
  @ApiOperation({ summary: "Liveness probe" })
  @ApiResponse({ status: 200, description: "Process is alive" })
  liveness() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
