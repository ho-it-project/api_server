import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AuthService } from './provider/auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TypedRoute.Get('/')
  async checkAuthStatus() {
    const a = this.authService.accessTokenSign({
      emergency_center_id: '1',
      employee_id: '1',
      id_card: '1',
      role: 'ADMIN',
    });
    const b = this.authService.accessTokenVerify({ access_token: a });
    console.log(a);
    console.log(b);
    return 'ok';
  }

  @TypedRoute.Post('/login')
  async login() {}

  @TypedRoute.Post('/logout')
  async logout() {}
}
