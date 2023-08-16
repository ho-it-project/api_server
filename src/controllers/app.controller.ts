import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AppService } from '../app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TypedRoute.Get('/er')
  getHello(): string {
    this.appService.getHello();
    return 'hello emergency room Service!';
  }
  @TypedRoute.Get('/ems')
  getNameTest() {
    return 'hello ems service';
  }
}
