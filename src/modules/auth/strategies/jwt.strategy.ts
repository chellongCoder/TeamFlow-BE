import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { TokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt?.fromAuthHeaderAsBearerToken?.(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || '',
    });
  }

  async validate(payload: TokenPayload) {
    // You can add additional validation logic here
    const user = await this.authService.findUserById(payload.sub);

    // Return a user object that will be attached to the request
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
      ...user,
    };
  }
}
