import { AUTH_ERROR, throwError } from '@config/errors';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import typia from 'typia';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const { role } = req.user;

    if (role !== 'ADMIN') {
      return throwError(typia.random<AUTH_ERROR.FORBIDDEN>());
    }
    return true;
  }
}
