import { winstonLogger } from '@common/logger/logger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT || 8000;
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });
  //   const docs = require('../packages/api/swagger.json');
  //   docs.servers = [{ url: 'http://localhost:8000/docs' }];
  //   SwaggerModule.setup('docs', app, docs);
  console.log(process.env.KAFKA_BOOTSTRAP_SERVERS?.split(',').map((a) => a.trim()));
  app.setGlobalPrefix('api');
  await app.listen(port);
}
bootstrap();
