import { createKafkaPayload } from '@common/kafka/kafka.message';
import { KafkaService } from '@common/kafka/kafka.service';
import { Injectable } from '@nestjs/common';
import { ReqEmsToErMessage } from '../interface/req/req.emsToEr.interface';

@Injectable()
export class ReqEmsToErProducer {
  constructor(private readonly kafkaService: KafkaService) {}

  //TODO: 소켓서버에서 바로 사용가능하도록 변경 // GET /request/ems-to-er 와 같은 ...?
  //TODO: req_EmstoErRequest model에 바로 사용가능한 데이터들 추가 ...
  //현재로써 추가해야할것 병원의 위도, 경도, 병원이름, 병원id, 환자id...
  async sendEmsToErNewRequest({ request_list, patient }: ReqEmsToErMessage.SendEmsToErNewRequest) {
    await Promise.all(
      request_list.map(async (req) => {
        await this.kafkaService.sendMessage<ReqEmsToErMessage.SendEmsToErNewRequestMessage>('ems.request.er', {
          message: createKafkaPayload(
            { ...req, patient },
            {
              messageType: 'ems.request.er',
              topicName: 'ems.request.er',
            },
          ),
          key: req.emergency_center_id,
        });
      }),
    );

    return;
  }
}
