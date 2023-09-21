import { KafkaModule } from '@common/kafka/kafka.module';
import { KafkaService } from '@common/kafka/kafka.service';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { v4 } from 'uuid';
import { AppModule } from '../../app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockKafkaService = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribeToTopics: jest.fn(),
      bindAllTopicToConsumer: jest.fn(),
      bindAllTopicToFixedConsumer: jest.fn(),
      runConsumer: jest.fn(),
      sendMessage: jest.fn(),
      kafkaLogger: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        KafkaModule.register({
          clientId: v4(),
          brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || '').split(',').map((a) => a.trim()),
          groupId: 'hoit',
        }),
      ],
    })
      .overrideProvider(KafkaService) // KafkaService를 오버라이드합니다.
      .useValue(mockKafkaService) // 목킹된 서비스를 제공합니다.
      .compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  it('should return "Hello World!" on GET /', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('"Hello World!"');
  });
});
