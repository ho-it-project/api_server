import { KafkaPayload } from '@common/kafka/kafka.message';
import { KafkaService } from '@common/kafka/kafka.service';
import { Injectable, Logger } from '@nestjs/common';
import typia from 'typia';
import { v4 } from 'uuid';
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly kafka: KafkaService) {}
  getHello(): string {
    this.logger.log('Hello World!');
    const message = typia.assert<KafkaPayload<{ data: string }>>(typia.random<KafkaPayload<{ data: string }>>());

    this.kafka.sendMessage('test_topic', { message: message, key: v4() });

    return 'Hello World!';
  }
}
