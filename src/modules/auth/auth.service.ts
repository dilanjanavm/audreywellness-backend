// src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
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
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('🔐 LOGIN: Starting authentication process');
    this.logger.log(`   User Email: ${user.email}`);
    this.logger.log('═══════════════════════════════════════════════════════');

    // Handle both legacy role and new role structure
    // Priority: legacyRole > role.code (mapped to UserRole) > role (fallback)
    let roleCode: string = UserRole.USER; // Default fallback
    let roleId: string | null = null;
    let roleName: string | undefined = undefined;
    
    if (user.legacyRole) {
      // Use legacy role if it exists (already in UserRole enum format)
      roleCode = user.legacyRole;
      this.logger.log(`   Using legacy role: ${roleCode}`);
    } else if (user.role?.code) {
      // Map Role.code to UserRole enum value
      const normalizedCode = user.role.code.toLowerCase();
      roleId = user.role.id;
      roleName = user.role.name;
      
      // Check if it matches a UserRole enum value
      const userRoleValues = Object.values(UserRole);
      if (userRoleValues.includes(normalizedCode as UserRole)) {
        roleCode = normalizedCode;
      } else {
        roleCode = normalizedCode;
        this.logger.warn(`Role code "${user.role.code}" does not match UserRole enum, using as-is`);
      }
      this.logger.log(`   Using role from database: ${roleCode} (ID: ${roleId})`);
    } else if (user.role) {
      // Fallback: if role is a string, use it directly
      roleCode = typeof user.role === 'string' ? user.role.toLowerCase() : UserRole.USER;
      this.logger.log(`   Using fallback role: ${roleCode}`);
    } else {
      this.logger.log(`   No role found, using default: ${roleCode}`);
    }
    
    roleId = user.roleId || roleId || null;

    // Fetch permissions for the user's role
    let permissions: any[] = [];
    if (roleId) {
      this.logger.log(`📋 Fetching permissions for role ID: ${roleId}`);
      try {
        permissions = await this.rolesService.getRolePermissions(roleId);
        this.logger.log(`✅ Found ${permissions.length} permissions for role`);
      } catch (error: any) {
        this.logger.warn(`⚠️  Failed to fetch permissions: ${error.message}`);
        this.logger.warn('   Continuing login without permissions');
      }
    } else {
      this.logger.log('⏭️  No role ID found, skipping permission fetch');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: [roleCode],
      roleId: roleId,
    };

    this.logger.log('🔑 Generating JWT tokens...');
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    this.logger.log('✅ Tokens generated successfully');

    const response = {
      access_token: access_token,
      refresh_token: refresh_token,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: roleCode,
        roleId: roleId,
        roleName: roleName,
        permissions: permissions,
      },
    };

    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('✅ LOGIN SUCCESSFUL');
    this.logger.log(`   User: ${user.email}`);
    this.logger.log(`   Role: ${roleCode}`);
    this.logger.log(`   Permissions: ${permissions.length}`);
    this.logger.log('═══════════════════════════════════════════════════════');

    return response;
  }

  private async comparePassword(
    plainText: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashedPassword);
  }
}
