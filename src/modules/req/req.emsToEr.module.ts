import { Module } from '@nestjs/common';
import { ReqEmsToErController } from '@src/controllers/request/req.emsToEr.controller';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';

@Module({
  controllers: [ReqEmsToErController],
  providers: [ReqEmsToErService],
})
export class ReqEmsToErModule {}
