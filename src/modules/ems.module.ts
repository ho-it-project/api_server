import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { EmsEmployeeModule } from './ems/ems.employee.module';

@Module({
  imports: [AuthModule, EmsEmployeeModule],
})
export class EmsModule {}
