import { SubscribeToFixedGroup } from '@common/kafka/kafka.decorator';
import { KafkaConsumerPayload } from '@common/kafka/kafka.message';
import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import typia from 'typia';
import { AppService } from './app.service';

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
    return 'test - test -- test --';
  }
  @SubscribeToFixedGroup('test_topic')
  async testTopic(payload: KafkaConsumerPayload<{ data: string }>) {
    // const data = typia.isParse<KafkaConsumerPayload<{ data: string }>>(payload);
    console.log(typia.is<KafkaConsumerPayload<{ data: string }>>(payload));
    console.log(payload);
  }
}
