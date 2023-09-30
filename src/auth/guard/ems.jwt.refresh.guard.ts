import { EMS_JWT_AUTH_REFRESH_GUARD } from '@config/constant';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class EmsJwtRefreshuthGuard extends AuthGuard(EMS_JWT_AUTH_REFRESH_GUARD) {
  private logger = new Logger(EmsJwtRefreshuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`EmsJwtRefreshuthGuard.handleRequest`);
    if (err) {
      throw err;
    }
    return user;
  }
}
