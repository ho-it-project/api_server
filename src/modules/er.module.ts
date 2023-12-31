import { Module } from '@nestjs/common';
import { AuthModule } from '@src/auth/auth.module';
import { ErDepartmentModule } from './er/department.module';
import { ErEmergencyCenterModule } from './er/emergencyCenter.module';
import { ErEmployeeModule } from './er/employee.module';
import { ErEquipmentModule } from './er/equipment.module';
import { ErIllnessModule } from './er/illness.module';
import { ErPatientModule } from './er/patient.module';

@Module({
  imports: [
    ErEmployeeModule,
    ErEmergencyCenterModule,
    AuthModule,
    ErDepartmentModule,
    ErEquipmentModule,
    ErIllnessModule,
    ErPatientModule,
  ],
})
export class ErModule {}
