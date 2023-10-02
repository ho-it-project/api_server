import { Module } from '@nestjs/common';
import { EmsAmbulanceCompanyController } from '@src/controllers/ems/ems.ambulanceCompany.controller';
import { EmsAmbulanceCampanyService } from '@src/providers/ems/ems.ambulanceCampany.service';

@Module({
  providers: [EmsAmbulanceCampanyService],
  controllers: [EmsAmbulanceCompanyController],
})
export class EmsAmbulanceCompanyModule {}
