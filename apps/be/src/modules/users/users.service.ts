/**
 * Users service.
 *
 * Implements user profile and account operations.
 */

import { Injectable } from "@nestjs/common";
import { UserRepository } from "@career-intelligence/database";
import { NotFoundError } from "@career-intelligence/shared";

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return {
      id: user._id,
      email: user.email,
      workspaceIds: user.workspaceIds,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { email?: string }) {
    return this.users.updateById(userId, data);
  }
}
