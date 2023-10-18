import { createKafkaMessage } from '@common/kafka/kafka.message';
import { EMS_REQUEST_ER, EMS_REQUEST_ER_RESPONSE, EMS_REQUEST_ER_UPDATE, KAFAKA_CLIENT } from '@config/constant';
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
        this.kafka.emit(EMS_REQUEST_ER, createKafkaMessage({ ...req, patient }, { key: req.emergency_center_id }));
      }),
    );
    return;
  }

  async sendEmsToErResponse(payload: ReqEmsToErMessage.SendEmsToErResponse) {
    const { emergency_center_id } = payload;
    this.kafka.emit(EMS_REQUEST_ER_RESPONSE, createKafkaMessage(payload, { key: emergency_center_id }));
  }

  async sendEmsToErUpdate({ patient, updated_list }: ReqEmsToErMessage.SendEmsToErUpdate) {
    await Promise.all(
      updated_list.map(async (req) => {
        const { ambulance_company_id, ambulance_company_name, ems_employee_id } = patient;
        const { patient_id, emergency_center_id, request_status } = req;
        this.kafka.emit(
          EMS_REQUEST_ER_UPDATE,
          createKafkaMessage(
            {
              ambulance_company_id,
              ambulance_company_name,
              ems_employee_id,
              patient_id,
              emergency_center_id,
              request_status,
            },
            { key: req.emergency_center_id },
          ),
        );
      }),
    );
  }
}
