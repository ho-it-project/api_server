import { CryptoModule } from '@common/crypto/crypto.module';
import { DbInit } from '@common/database/db.init';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { PrismaModule } from '@common/prisma/prisma.module';
import { KAFAKA_CLIENT } from '@config/constant';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-store';
import Joi from 'joi';
import { v4 } from 'uuid';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmsModule } from './modules/ems.module';
import { ErModule } from './modules/er.module';
import { ReqModule } from './modules/req.module';
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
    ClientsModule.register({
      clients: [
        {
          name: KAFAKA_CLIENT,
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: `api-${v4()}`,
              brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
            },
            consumer: {
              groupId: 'hoit-api-server',
            },
          },
        },
      ],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: (await redisStore({
          url: configService.get('REDIS_URL') || 'redis://localhost:6379/',
        })) as unknown as CacheStore,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CryptoModule,
    ErModule,
    EmsModule,
    ReqModule,
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
