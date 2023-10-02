import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_AMBULANCE_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import typia from 'typia';

@Injectable()
export class EmsAmbulanceService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAmbulanceDetail(ambulanceId: string) {
    const ambulance = await this.prismaService.ems_Ambulance.findUnique({
      where: {
        ambulance_id: ambulanceId,
      },
      include: {
        ambulance_company: true,
      },
    });

    if (!ambulance) {
      return typia.random<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>();
    }

    return ambulance;
  }
}
