import { KafkaConsumerPayload } from '@common/kafka/kafka.message';
import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import typia from 'typia';
import { AppService, TestDTO } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @TypedRoute.Get('/')
  getHello(): string {
    this.appService.getHello();
    return 'Hello World!';
  }

  @TypedRoute.Get('/a')
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
    return 'test - test -- test --';
  }

  // @SubscribeToFixedGroup('ems.request.er')
  async testTopic(payload: KafkaConsumerPayload<TestDTO>) {
    // const data = typia.isParse<KafkaConsumerPayload<{ data: string }>>(payload);

    console.log(typia.is<KafkaConsumerPayload<TestDTO>>(payload));
    console.log(payload.value.body);
  }
}
