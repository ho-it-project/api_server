import { EMS_JWT_AUTH_ACCESS_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import typia from 'typia';

@Injectable()
export class ErJwtAccessAuthGuard extends AuthGuard(EMS_JWT_AUTH_ACCESS_GUARD) {
  private logger = new Logger(ErJwtAccessAuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`ErJwtAccessAuthGuard.handleRequest`);
    if (err || !user) {
      throwError(typia.random<AUTH_ERROR.FORBIDDEN>());
    }
    return user;
  }
}
