import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const docs = require('../packages/api/swagger.json');
  docs.servers = [{ url: 'http://localhost:3000/docs' }];

  SwaggerModule.setup('docs', app, docs);
  await app.listen(3000);
}
bootstrap();
