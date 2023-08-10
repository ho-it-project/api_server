import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { TestBody2 } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TypedRoute.Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @TypedRoute.Get('/string/:name')
  getNameTest(@TypedParam('name') name: string) {
    return name;
  }
  @TypedRoute.Get('/number/:name')
  getNumberTest(@TypedParam('name') name: number) {
    return name;
  }
  @TypedRoute.Post('')
  postHello(@TypedBody() body: TestBody2) {
    return body;
  }
}
