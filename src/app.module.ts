import { DbInit } from '@common/database/db.init';
import { KafkaModule } from '@common/kafka/kafka.module';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 } from 'uuid';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ErModule } from './modules/er.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KafkaModule.register({
      clientId: v4(),
      brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
      groupId: 'hoit',
    }),
    PrismaModule,
    ErModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger, DbInit],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
// brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
