/**
 * Custom decorators for authorization metadata.
 */

import { SetMetadata } from "@nestjs/common";

export const Permissions = (...permissions: string[]) =>
  SetMetadata("permissions", permissions);

export const WorkspaceAgnostic = () => SetMetadata("workspaceAgnostic", true);
