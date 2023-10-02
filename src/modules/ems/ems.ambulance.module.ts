import { Module } from '@nestjs/common';
import { EmsAmbulanceController } from '@src/controllers/ems/ems.ambulance.controller';
import { EmsAmbulanceService } from '@src/providers/ems/ems.ambulance.service';

@Module({
  providers: [EmsAmbulanceService],
  controllers: [EmsAmbulanceController],
})
export class EmsAmbulanceModule {}
