import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AppService } from '../app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TypedRoute.Get('/')
  getHello(): string {
    this.appService.getHello();
    return 'Hello World!';
  }

  @TypedRoute.Get('/er')
  connectER(): string {
    this.appService.getHello();
    return 'hello emergency room Service!!!';
  }
  @TypedRoute.Get('/ems')
  connectEMS() {
    return 'hello ems service';
  }
  @TypedRoute.Get('/test')
  test() {
    return 'test - test -- test';
  }
}
