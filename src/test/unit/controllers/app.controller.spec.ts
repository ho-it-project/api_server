import { DbInit } from '@common/database/db.init';
import { PrismaModule } from '@common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';

describe('AppController', () => {
  let appController: AppController;
  // jest.mock('../../../common/kafka/kafka.module', () => ({
  //   KafkaModule: {
  //     register: jest.fn().mockReturnValue({
  //       clientId: v4(),
  //       brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
  //       groupId: 'hoit',
  //     }),
  //   },
  // }));
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, DbInit],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        // KafkaModule.register({
        //   clientId: v4(),
        //   brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
        //   groupId: 'hoit',
        // }),
        PrismaModule,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
