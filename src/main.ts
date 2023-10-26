import { winstonLogger } from '@common/logger/logger';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT || 8000;
  console.log(port);
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'api',
        brokers: process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()) as string[],
      },
      consumer: { groupId: 'hoit-api-server' },
    },
  });

  const docs = require('../packages/api/swagger.json');
  docs.servers = [{ url: 'https://api.ho-it.me/api' }, { url: 'http://localhost:8000/api' }];
  SwaggerModule.setup('/docs', app, docs, {
    swaggerOptions: {},
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.use(passport.initialize());

  app.enableCors({
    origin: [
      'https://er.ho-it.me',
      'https://ems.ho-it.me',
      'http://er.development.com',
      'http://ems.development.com',
      'http://localhost:4000',
      'http://localhost:3000',
    ], //초기 개발환경에서는 모든 요청을 허용하도록 하였습니다.
    credentials: true,
  });

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
