import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            this.logger.warn('User not found in request context');
            return false;
        }

        // Allow Super Admin to bypass permission checks
        const userRoles = user.roles || [user.role];
        const normalizedUserRoles = userRoles.map((r: string) =>
            typeof r === 'string' ? r.toLowerCase() : r
        );

        // Check for Super Admin
        if (normalizedUserRoles.includes('super_admin') || normalizedUserRoles.includes('super admin')) {
            return true;
        }

        // Check permissions
        const userPermissions = user.permissions || [];

        // If user has no permissions array, access is denied (unless super admin)
        if (!userPermissions || userPermissions.length === 0) {
            this.logger.warn(`User ${user.email} has no permissions assigned`);
            return false;
        }

        // Extract permission codes from user permissions (handling both object and string format)
        const userPermissionCodes = userPermissions.map(p =>
            typeof p === 'string' ? p : p.code
        );

        const hasPermission = requiredPermissions.some((permission) =>
            userPermissionCodes.includes(permission),
        );

        if (!hasPermission) {
            this.logger.warn(`User ${user.email} missing required permissions: ${requiredPermissions.join(', ')}`);
        }

        return hasPermission;
    }
}
