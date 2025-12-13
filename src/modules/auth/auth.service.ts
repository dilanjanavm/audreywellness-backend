// src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log(`🔍 Validating user: ${email}`);

    // Find user in database
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log('❌ User not found:', email);
      return null;
    }

    console.log('✅ User found, comparing passwords...');

    // Compare passwords
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (isPasswordValid) {
      console.log('✅ Password valid for user:', email);
      // Remove password from returned user object
      const { password, ...result } = user;
      return result;
    } else {
      console.log('❌ Invalid password for user:', email);
      return null;
    }
  }

  async login(user: any) {
    console.log('🎯 Login service - user:', user.email);

    // Handle both legacy role and new role structure
    // Priority: legacyRole > role.code (mapped to UserRole) > role (fallback)
    let roleCode: string = UserRole.USER; // Default fallback
    
    if (user.legacyRole) {
      // Use legacy role if it exists (already in UserRole enum format)
      roleCode = user.legacyRole;
    } else if (user.role?.code) {
      // Map Role.code to UserRole enum value
      // Convert Role.code (e.g., "ADMIN", "MANAGER") to UserRole enum format (e.g., "admin", "manager")
      const normalizedCode = user.role.code.toLowerCase();
      
      // Check if it matches a UserRole enum value
      const userRoleValues = Object.values(UserRole);
      if (userRoleValues.includes(normalizedCode as UserRole)) {
        roleCode = normalizedCode;
      } else {
        // If Role.code doesn't match UserRole enum, use the code as-is
        // But still normalize to lowercase for consistency
        roleCode = normalizedCode;
        console.warn(`Role code "${user.role.code}" does not match UserRole enum, using as-is`);
      }
    } else if (user.role) {
      // Fallback: if role is a string, use it directly
      roleCode = typeof user.role === 'string' ? user.role.toLowerCase() : UserRole.USER;
    }
    
    const roleId = user.roleId || null;

    const payload = {
      sub: user.id,
      email: user.email,
      roles: [roleCode],
      roleId: roleId,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: access_token,
      refresh_token: refresh_token,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: roleCode,
        roleId: roleId,
      },
    };
  }

  private async comparePassword(
    plainText: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashedPassword);
  }
}
