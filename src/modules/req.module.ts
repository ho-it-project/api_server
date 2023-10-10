import { Module } from '@nestjs/common';
import { ReqEmsToErModule } from './req/req.emsToEr.module';

/**
 * 요청
 * EMS to ER : 외부에서 응급환자 수용 요청
 * ER to EMS : 응급실에서 응급환자 이송 요청
 * ER to ER  : 응급실간 수용 요청
 */
@Module({
  controllers: [],
  imports: [ReqEmsToErModule],
})
export class ReqModule {}
