import { Module } from '@nestjs/common';
import { ReqEmsToErController } from '@src/controllers/request/req.emsToEr.controller';
import { ReqEmsToErProducer } from '@src/providers/req/req.emsToEr.producer';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';

@Module({
  controllers: [ReqEmsToErController],
  providers: [ReqEmsToErService, ReqEmsToErProducer],
})
export class ReqEmsToErModule {}
