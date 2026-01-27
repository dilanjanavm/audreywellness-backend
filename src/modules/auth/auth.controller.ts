// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Request,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    console.log('Login attempt for:', loginDto.username);

    // Validate user credentials
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      console.log('Invalid credentials for:', loginDto.username);
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log('User validated, generating tokens for:', user.email);

    // Generate JWT tokens
    return this.authService.login(user);
  }
}
