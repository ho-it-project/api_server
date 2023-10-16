import { Module } from '@nestjs/common';
import { ReqEmsToErController } from '@src/controllers/request/req.emsToEr.controller';
import { EmsPatientService } from '@src/providers/ems/ems.patient.service';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ReqEmsToErProducer } from '@src/providers/req/req.emsToEr.producer';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';

@Module({
  controllers: [ReqEmsToErController],
  providers: [ReqEmsToErService, ReqEmsToErProducer, EmsPatientService, ErEmergencyCenterService],
})
export class ReqEmsToErModule {}
