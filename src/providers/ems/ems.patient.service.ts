import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import typia from 'typia';
import { v4 } from 'uuid';
import { EmsPatient } from '../interface/ems/ems.patient.interface';

@Injectable()
export class EmsPatientService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly erEmergencyCenterService: ErEmergencyCenterService, // private readonly cryptoService: CryptoService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createPatient(createPatientDTO: EmsPatient.CreatePatientDTO) {
    this.prismaService;
    this.erEmergencyCenterService;
    createPatientDTO;
    const { patientInfo, user } = createPatientDTO;
    const { patient_identity_number } = patientInfo;
    const salt = v4();
    // 주민등록번호 뒷자리 암호화
    const encryptedIdentityNumber = await this.cryptoService.encrypt({
      data: patient_identity_number,
      salt,
    });

    console.log(encryptedIdentityNumber.length);

    // this.prismaService.ems_Patient.findFirst({
    //   where: {},
    // });
    // const { user, patientInfo } = createPatientDTO;
    const { employee_id } = user;
    const inchargePatient = await this.prismaService.ems_Patient.findFirst({
      where: {
        ems_employee_id: employee_id,
        patient_status: {
          notIn: ['COMPLETED', 'CANCELED'],
        },
      },
    });
    if (inchargePatient) {
      return typia.random<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>();
    }
    // TODO : 주석 제거
    // 중복 생성되면 매번 바꿔주어야 하기에 생성된다 가정....

    const newPatient = await this.prismaService.ems_Patient.create({
      data: {
        ...patientInfo,
        ems_employee_id: employee_id,
        patient_identity_number: encryptedIdentityNumber,
        patient_salt: {
          create: {
            salt,
          },
        },
      },
    });

    // TODO : redis cache 적용 - 주변병원 리스트
    // const { patient_latitude, patient_longitude } = patientInfo;
    // const emergencyCenterList = await this.prismaService.er_EmergencyCenter.findMany({});
    // const emergencyCenters = this.erEmergencyCenterService.sortEmergencyCenterListByDistance({
    //   latitude: patient_latitude,
    //   longitude: patient_longitude,
    //   emergencyCenterList,
    // });

    return newPatient;
  }
}
