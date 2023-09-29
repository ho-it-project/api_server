import { JWT_AUTH_ACCESS_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import typia from 'typia';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard(JWT_AUTH_ACCESS_GUARD) {
  private logger = new Logger(JwtAccessAuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`JwtAccessAuthGuard.handleRequest`);
    if (err || !user) {
      throwError(typia.random<AUTH_ERROR.FORBIDDEN>());
    }
    return user;
  }
}
