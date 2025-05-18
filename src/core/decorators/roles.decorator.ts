import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'user',
  TEAM_MEMBER = 'team_member',
  TEAM_ADMIN = 'team_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
