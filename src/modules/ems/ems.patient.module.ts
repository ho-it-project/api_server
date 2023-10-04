import { Module } from '@nestjs/common';
import { EmsPatientController } from '@src/controllers/ems/ems.patient.controller';
import { EmsPatientService } from '@src/providers/ems/ems.patient.service';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';

@Module({
  providers: [EmsPatientService, ErEmergencyCenterService],
  controllers: [EmsPatientController],
})
export class EmsPatientModule {}
