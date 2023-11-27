import { Module } from '@nestjs/common';
import { ErPatientController } from '@src/controllers/er/er.patient.controller';
import { ErRequestPatientController } from '@src/controllers/er/er.requestPatient.controller';
import { ErPatientService } from '@src/providers/er/er.patient.service';
import { ErRequestPatientService } from '@src/providers/er/er.requestPatient.service';

@Module({
  controllers: [ErPatientController, ErRequestPatientController],
  providers: [ErPatientService, ErRequestPatientService],
})
export class ErPatientModule {}
