import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ log: [{ emit: 'stdout', level: 'warn' }], errorFormat: 'pretty' });
  }

  async onModuleInit() {
    await this.$connect();

    // 미들웨어
    // 미들웨어 설정
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
