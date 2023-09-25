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
  docs.servers = [{ url: 'http://localhost:8000/docs' }];
  SwaggerModule.setup('docs', app, docs);
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
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
