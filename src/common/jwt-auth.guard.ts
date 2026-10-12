import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Wymaga poprawnego tokenu JWT. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** Token jest opcjonalny - bez niego `req.user` pozostaje undefined, ale zły token nadal daje 401. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (!req.headers?.authorization) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err) throw err;
    return user || undefined;
  }
}
