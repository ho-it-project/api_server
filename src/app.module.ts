import { CryptoModule } from '@common/crypto/crypto.module';
import { DbInit } from '@common/database/db.init';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { PrismaModule } from '@common/prisma/prisma.module';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmsModule } from './modules/ems.module';
import { ErModule } from './modules/er.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        // Database
        DATABASE_URL: Joi.string().required(),
        // Kafka
        KAFKA_BOOTSTRAP_SERVERS: Joi.string().required(),
        // JWT
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

        // Hash
        HASH_SALT: Joi.number().required(),

        // Crypto
        SCRYPT_PASSWORD: Joi.string().required(),
      }),
    }),
    // KafkaModule.register({
    //   clientId: v4(),
    //   brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
    //   groupId: 'hoit',
    // }),
    PrismaModule,
    CryptoModule,
    ErModule,
    EmsModule,
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
