import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';


@Injectable()
export class HospitalService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHospitalList() {
    return await this.prismaService.er_Hospital.findMany();
  }
}
