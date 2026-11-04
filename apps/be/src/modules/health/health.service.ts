import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  readiness() {
    return {
      status: 'ok',
      service: 'career-intelligence-os-be',
      timestamp: new Date().toISOString(),
    };
  }
}
