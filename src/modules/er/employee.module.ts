import { Module } from '@nestjs/common';
import { ErEmployeeController } from '@src/controllers/er/er.employee.controller';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';

@Module({
  providers: [ErEmployeeService],
  controllers: [ErEmployeeController],
})
export class ErEmployeeModule {}
