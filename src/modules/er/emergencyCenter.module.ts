import { Module } from '@nestjs/common';
import { ErEmergencyCenterController } from '@src/controllers/er/er.emergencyCenter.controller';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';

@Module({
  controllers: [ErEmergencyCenterController],
  providers: [ErEmergencyCenterService],
})
export class ErEmergencyCenterModule {}
