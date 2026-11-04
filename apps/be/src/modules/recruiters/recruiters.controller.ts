import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecruitersService } from './recruiters.service';

@ApiTags('recruiters')
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruiters: RecruitersService) {}

  @Get()
  list() {
    return this.recruiters.list();
  }
}
