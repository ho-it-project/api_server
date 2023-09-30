import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';

@Controller('/ems/auth')
export class EmsAuthController {
  @TypedRoute.Get('/')
  async checkAuthStatus(): Promise<any> {
    return 'hello';
  }

  @TypedRoute.Post('/login')
  async login(): Promise<any> {
    return 'hello';
  }
}
