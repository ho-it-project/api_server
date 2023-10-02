import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { EmsAmbulanceCompanyModule } from './ems/ems.ambulanceCompany.module';
import { EmsEmployeeModule } from './ems/ems.employee.module';

@Module({
  imports: [AuthModule, EmsEmployeeModule, EmsAmbulanceCompanyModule],
})
export class EmsModule {}
