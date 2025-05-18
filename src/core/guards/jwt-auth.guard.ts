import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseService } from '../supabase';
import { RequestWithUser } from '../decorators';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: RequestWithUser = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const { data, error } =
        await this.supabaseService.client.auth.getUser(token);

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      // Add user to request object
      request.user = data.user;
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] =
      (request.headers['authorization'] as string)?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
