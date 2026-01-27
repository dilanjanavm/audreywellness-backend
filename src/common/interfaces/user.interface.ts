// src/common/interfaces/user.interface.ts
import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  email: string;
  username: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  sub: string;
  email: string;
  username: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}
