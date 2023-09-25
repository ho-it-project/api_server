import { JWT_AUTH_ACCESS_GUARD } from '@config/constant';
import { ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_ERROR } from '@src/types/errors';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard(JWT_AUTH_ACCESS_GUARD) {
  private logger = new Logger(JwtAccessAuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`JwtAccessAuthGuard.handleRequest`);
    if (err || !user) {
      throw err || new ForbiddenException(AUTH_ERROR.FORBIDDEN);
    }
    return user;
  }
}
