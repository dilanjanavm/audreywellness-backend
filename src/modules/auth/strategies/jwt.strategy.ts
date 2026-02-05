// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RolesService } from '../../roles/roles.service';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private rolesService: RolesService,
    private usersService: UsersService,
  ) {
    // @ts-ignore
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userId = payload.sub;
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Use current role from DB, not token
    // Priority: legacyRole > role.code (mapped) > role (fallback)

    // Determine Role Code for Guard checks
    let roleCode = UserRole.USER;
    if (user.legacyRole) {
      roleCode = user.legacyRole;
    } else if (user.role?.code) {
      roleCode = user.role.code as UserRole; // Best effort cast
    }

    // Ensure roles array is fresh
    const roles = [roleCode];

    // Fetch permissions using fresh roleId from DB
    let permissions: string[] = [];
    if (user.roleId) {
      try {
        const rolePermissions = await this.rolesService.getRolePermissions(user.roleId);
        // Map to permission codes if needed, but getRolePermissions returns objects with 'code'
        // PermissionsGuard handles objects, so returning the full object is safer/richer
        permissions = rolePermissions || [];
      } catch (error) {
        console.warn(`Failed to fetch permissions for roleId ${user.roleId}`, error);
      }
    }

    return {
      userId: user.id,
      roles: roles, // Fresh roles from DB
      role: roleCode,
      permissions: permissions, // Fresh permissions from DB
      // Attach full user object context
      ...user,
    };
  }
}
