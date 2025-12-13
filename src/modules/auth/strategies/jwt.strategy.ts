// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // @ts-ignore
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // FIX: Return the expected user object with roles
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      userId: payload.sub,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      email: payload.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      roles: payload.roles || [payload.role], // Handle both formats
    };
  }
}
