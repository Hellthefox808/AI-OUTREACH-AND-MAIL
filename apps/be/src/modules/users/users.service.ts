import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  me() {
    return { authenticated: false };
  }
}
