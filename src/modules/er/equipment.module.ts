import { Module } from '@nestjs/common';
import { ErEquipmentController } from '@src/controllers/er/er.equipment.controller';
import { ErEquipmentService } from '@src/providers/er/er.equipment.service';

@Module({
  controllers: [ErEquipmentController],
  providers: [ErEquipmentService],
})
export class ErEquipmentModule {}
