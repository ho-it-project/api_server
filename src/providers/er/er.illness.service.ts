import { PrismaService } from '@common/prisma/prisma.service';
import { ER_ILLNESS_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErIllness } from '../interface/er/er.illness.interface';

@Injectable()
export class ErIllnessService {
  constructor(private readonly prismaService: PrismaService) {}
  async getServableIllnessStatusById({
    hospital_id,
    query,
  }: ErIllness.GetServableIllnessStatusArg): Promise<ErIllness.GetServableIllnessStatusReturn> {
    const status = query?.status ? query.status : null;

    //validate hospital id
    const er_id__exist = await this.prismaService.er_Hospital.findFirst({
      where: { hospital_id },
    });
    if (er_id__exist === null) {
      return ER_ILLNESS_ERROR.hospitalInvalid;
    }

    const where: Prisma.er_ServereIllnessFindManyArgs['where'] = {
      ...(status && { hospital_servere_illness: { some: { hospital_id, status } } }),
    };

    const result = await this.prismaService.er_ServereIllness.findMany({
      where,
      include: {
        hospital_servere_illness: {
          where: { hospital_id },
        },
      },
    });
    console.log(result);
    const formatted_result = result.map((v) => ({
      servable_illness_id: v.servere_illness_id,
      servable_illness_name: v.servere_illness_name,
      status: v.hospital_servere_illness.length ? v.hospital_servere_illness[0].status : 'INACTIVE',
    }));
    return formatted_result;
  }

  async validatePatchDocument(
    document: ErIllness.UpdateServableIllnessStatusArg['document'],
  ): Promise<string[] | true> {
    const ids = document.map((v) => v.illness_id);
    const result = (
      await this.prismaService.er_ServereIllness.findMany({
        where: { servere_illness_id: { in: ids } },
        select: { servere_illness_id: true },
      })
    ).map((v) => v.servere_illness_id);
    const r = ids.filter((v) => !result.includes(v));
    if (r.length == 0) return true;
    return r;
  }

  async updateCurrentServableIllnessStatus({
    user,
    document,
  }: ErIllness.UpdateServableIllnessStatusArg): Promise<ErIllness.UpdateServableIllnessStatusReturn> {
    const { hospital_id } = user;
    const isValid = await this.validatePatchDocument(document);
    if (isValid !== true) {
      const error = { ...ER_ILLNESS_ERROR.illnessNotExist };
      error.message += isValid.toString();
      return error;
    }
    const patchedData = await this.prismaService.$transaction(
      document.map((v) =>
        this.prismaService.er_HospitalServereIllness.upsert({
          where: { hospital_id_servere_illness_id: { hospital_id, servere_illness_id: v.illness_id } },
          create: { hospital_id, servere_illness_id: v.illness_id, status: v.illness_status },
          update: { status: v.illness_status },
          include: {
            servere_illness: { select: { servere_illness_name: true } },
          },
        }),
      ),
    );
    const result = patchedData.map((v) => ({
      servable_illness_id: v.servere_illness_id,
      servable_illness_name: v.servere_illness.servere_illness_name,
      status: v.status,
    }));
    return result;
  }
}
