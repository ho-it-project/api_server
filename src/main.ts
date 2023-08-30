import { winstonLogger } from '@common/logger/logger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });

  //   const docs = require('../packages/api/swagger.json');
  //   docs.servers = [{ url: 'http://localhost:8000/docs' }];
  //   SwaggerModule.setup('docs', app, docs);
  app.setGlobalPrefix('api');

  await app.listen(8000);
}
bootstrap();
