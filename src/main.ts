import { winstonLogger } from '@common/logger/logger';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import passport from 'passport';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT || 8000;
  console.log(process.env.NODE_ENV);
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });
  const docs = require('../packages/api/swagger.json');
  docs.servers = [{ url: 'https://api.ho-it.me/api' }, { url: 'http://localhost:8000/api' }];
  SwaggerModule.setup('/docs', app, docs, {
    swaggerOptions: {},
  });
  console.log(process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()));
  app.setGlobalPrefix('api');
  // app.use(cookieParser);
  app.use(
    session({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      secret: 'secret',
    }),
  );
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: '*', //초기 개발환경에서는 모든 요청을 허용하도록 하였습니다.
  });

  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
