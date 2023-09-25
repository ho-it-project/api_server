import { JWT_AUTH_REFRESH_GUARD } from '@config/constant';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtRefreshuthGuard extends AuthGuard(JWT_AUTH_REFRESH_GUARD) {
  private logger = new Logger(JwtRefreshuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    this.logger.debug(`JwtRefreshuthGuard.handleRequest`);
    if (err) {
      throw err;
    }
    return user;
  }
}
