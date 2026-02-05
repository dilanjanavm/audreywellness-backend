// src/modules/users/dto/user-response.dto.ts
import { Gender } from '../user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UserResponseDto {
  id: string;
  userName: string;
  email: string;
  mobileNumber?: string;
  address?: string;
  contactNumber?: string;
  age?: number;
  gender?: Gender;
  roleId?: string;
  role?: {
    id: string;
    name: string;
    code: string;
  };
  legacyRole?: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

