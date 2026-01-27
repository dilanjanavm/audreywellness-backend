// src/modules/users/dto/user-response.dto.ts
import { Gender } from '../user.entity';

export class UserResponseDto {
  id: string;
  userName: string;
  email: string;
  mobileNumber?: string;
  address?: string;
  contactNumber: string;
  age?: number;
  gender?: Gender;
  roleId?: string;
  role?: {
    id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

