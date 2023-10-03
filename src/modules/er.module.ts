import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { ErEmergencyCenterModule } from './er/emergencyCenter.module';
import { ErEmployeeModule } from './er/employee.module';
import { ErDepartmentModule } from './er/department.module';

@Module({
  imports: [ErEmployeeModule, ErEmergencyCenterModule, AuthModule, ErDepartmentModule],
})
export class ErModule {}
