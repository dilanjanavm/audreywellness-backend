// src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
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

    const payload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: access_token,
      refresh_token: refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
