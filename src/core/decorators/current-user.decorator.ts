import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@supabase/supabase-js';

// Define interface extending Request to include user
export interface RequestWithUser extends Request {
  user: User; // Use the generated Prisma users type
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
