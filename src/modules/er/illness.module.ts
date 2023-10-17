import { Module } from '@nestjs/common';
import { ErIllnessController } from '@src/controllers/er/er.illness.controller';
import { ErIllnessService } from '@src/providers/er/er.illness.service';

@Module({
  providers: [ErIllnessService],
  controllers: [ErIllnessController],
})
export class ErIllnessModule {}
