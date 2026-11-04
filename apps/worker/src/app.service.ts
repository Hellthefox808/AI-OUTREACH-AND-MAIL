import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  health() {
    return { status: "ok", service: "career-intelligence-os-worker", timestamp: new Date().toISOString() };
  }
}
