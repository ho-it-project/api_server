import { Module } from '@nestjs/common';
import { ErPatientController } from '@src/controllers/er/er.patient.controller';
import { ErPatientService } from '@src/providers/er/er.patient.service';

@Module({
  controllers: [ErPatientController],
  providers: [ErPatientService],
})
export class ErPatientModule {}
