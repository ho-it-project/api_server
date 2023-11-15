import { COMMON_AUTH_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import typia from 'typia';

@Injectable()
export class CommonAuthGuard extends AuthGuard(COMMON_AUTH_GUARD) {
  private logger = new Logger(CommonAuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`CommonAuthGuard.handleRequest`);
    if (err) {
      throwError(typia.random<AUTH_ERROR.FORBIDDEN>());
    }
    return user;
  }
}
