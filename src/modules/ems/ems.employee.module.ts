import { Module } from '@nestjs/common';
import { EmsEmployeeController } from '@src/controllers/ems/ems.employee.controller';
import { EmsEmployeeService } from '@src/providers/ems/ems.employee.service';

@Module({
  controllers: [EmsEmployeeController],
  providers: [EmsEmployeeService],
})
export class EmsEmployeeModule {}
