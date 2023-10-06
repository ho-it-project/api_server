import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { EmsAmbulanceModule } from './ems/ems.ambulance.module';
import { EmsAmbulanceCompanyModule } from './ems/ems.ambulanceCompany.module';
import { EmsEmployeeModule } from './ems/ems.employee.module';
import { EmsPatientModule } from './ems/ems.patient.module';

@Module({
  imports: [AuthModule, EmsEmployeeModule, EmsAmbulanceCompanyModule, EmsAmbulanceModule, EmsPatientModule],
})
export class EmsModule {}
