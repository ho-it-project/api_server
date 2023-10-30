import { Module } from '@nestjs/common';
import { ErDepartmentController } from '@src/controllers/er/er.department.controller';
import { ErDepartmentTemporaryController } from '@src/controllers/er/er.department.temporary.controller';
import { ErDepartmentService } from '@src/providers/er/er.department.service';

@Module({
  providers: [ErDepartmentService],
  controllers: [ErDepartmentController, ErDepartmentTemporaryController],
})
export class ErDepartmentModule {}
