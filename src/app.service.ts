import { KafkaPayload } from '@common/kafka/kafka.message';
import { KafkaService } from '@common/kafka/kafka.service';
import { Injectable, Logger } from '@nestjs/common';
import typia from 'typia';
import { v4 } from 'uuid';

export interface TestDTO {
  data: {
    user_id: string;
    user_name: string;
    request_id: string;
  };
}
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly kafka: KafkaService) {}
  kafkaTest(): string {
    this.logger.log('Hello World!');
    const message = typia.assert<KafkaPayload<TestDTO>>(typia.random<KafkaPayload<TestDTO>>());

    this.kafka.sendMessage('ems.request.er', { message: message, key: v4() });

    return 'Hello World!';
  }
  getHello(): string {
    return 'Hello World!';
  }
}
