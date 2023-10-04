import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { EmsPatient } from '../interface/ems/ems.patient.interface';

@Injectable()
export class EmsPatientService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly erEmergencyCenterService: ErEmergencyCenterService,
  ) {}

  async createPatient(patinetInfo: EmsPatient.CreatePatientDTO) {
    this.prismaService;
    this.erEmergencyCenterService;
    const { patient_latitude, patient_longitude } = patinetInfo;
    console.log(patinetInfo);

    const emergencyCenterList = await this.prismaService.er_EmergencyCenter.findMany({});
    const emergencyCenters = await this.erEmergencyCenterService.sortEmergencyCenterListByDistance({
      latitude: patient_latitude,
      longitude: patient_longitude,
      emergencyCenterList,
    });
    // const emergencyCenters = [];
    console.log(Number(NaN) * 0);

    return emergencyCenters;
  }
}
