import { Module } from '@nestjs/common';
import { ErPatientController } from '@src/controllers/er/er.patient.controller';
import { ErRequestPatientController } from '@src/controllers/er/er.requestPatient.controller';
import { ErPatientService } from '@src/providers/er/er.patient.service';
import { ErRequestPatientService } from '@src/providers/er/er.requestPatient.service';
import { ReqEmsToErProducer } from '@src/providers/req/req.emsToEr.producer';

@Module({
  controllers: [ErPatientController, ErRequestPatientController],
  providers: [ErPatientService, ErRequestPatientService, ReqEmsToErProducer],
})
export class ErPatientModule {}
