import { Module } from '@nestjs/common';
import { ErDepartmentController } from '@src/controllers/er/er.department.controller';
import { ErDepartmentService } from '@src/providers/er/er.department.service';

@Module({
  providers: [ErDepartmentService],
  controllers: [ErDepartmentController],
})
export class ErDepartmentModule {}
