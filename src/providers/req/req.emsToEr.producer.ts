import { createKafkaMessage } from '@common/kafka/kafka.message';
import { KAFAKA_CLIENT } from '@config/constant';
import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ReqEmsToErMessage } from '../interface/req/req.emsToEr.interface';

@Injectable()
export class ReqEmsToErProducer {
  constructor(
    @Inject(KAFAKA_CLIENT)
    private readonly kafka: ClientKafka, // private readonly kafkaService: KafkaService
  ) {}

  // //TODO: 소켓서버에서 바로 사용가능하도록 변경 // GET /request/ems-to-er 와 같은 ...?
  // //TODO: req_EmstoErRequest model에 바로 사용가능한 데이터들 추가 ...
  // //현재로써 추가해야할것 병원의 위도, 경도, 병원이름, 병원id, 환자id...
  async sendEmsToErNewRequest({ request_list, patient }: ReqEmsToErMessage.SendEmsToErNewRequest) {
    await Promise.all(
      request_list.map(async (req) => {
        this.kafka.emit('ems.request.er', createKafkaMessage({ ...req, patient }, { key: req.emergency_center_id }));
      }),
    );

    return;
  }

  async sendEmsToErResponse({
    patient,
    response,
    reject_reason,
    emergency_center_id,
  }: ReqEmsToErMessage.SendEmsToErResponse) {
    this.kafka.emit(
      'er.response.ems',
      createKafkaMessage({ patient, response, reject_reason, emergency_center_id }, { key: emergency_center_id }),
    );
  }
}
