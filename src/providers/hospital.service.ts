import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class HospitalService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHospitalList() {
    return await this.prismaService.er_Hospital.findMany();
  }
}
