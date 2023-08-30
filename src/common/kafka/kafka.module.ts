import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { KafkaConfig } from './kafka.message';
import { KafkaService } from './kafka.service';

@Global()
@Module({})
export class KafkaModule {
  static register(kafkaConfig: KafkaConfig): DynamicModule {
    return {
      global: true,
      module: KafkaModule,
      providers: [
        {
          provide: KafkaService,
          useValue: new KafkaService(kafkaConfig),
        },
        Logger,
      ],
      exports: [KafkaService],
    };
  }
}
