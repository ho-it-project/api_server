import { KafkaPayload } from '@common/kafka/kafka.message';
import { KafkaService } from '@common/kafka/kafka.service';
import { Injectable, Logger } from '@nestjs/common';
import typia from 'typia';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly kafka: KafkaService) {}
  getHello(): string {
    this.logger.log('Hello World!');
    const event = typia.assert<KafkaPayload<{ data: string }>>({
      messageId: uuidv4(),
      body: { data: 'test Hello World!' },
      topicName: 'request_ems',
      messageType: 'test',
    });

    this.kafka.sendMessage('test_topic', event);

    return 'Hello World!';
  }
}
