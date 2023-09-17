import { Module } from '@nestjs/common';
import { ErController } from '@src/controllers/er.controller';
import { HospitalService } from '@src/providers/hospital.service';

@Module({
  providers: [HospitalService],
  controllers: [ErController],
})
export class ErModule {}
