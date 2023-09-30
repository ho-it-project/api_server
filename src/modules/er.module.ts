import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { ErEmergencyCenterModule } from './er/emergencyCenter.module';
import { ErEmployeeModule } from './er/employee.module';

@Module({
  imports: [ErEmployeeModule, ErEmergencyCenterModule, AuthModule],
})
export class ErModule {}
