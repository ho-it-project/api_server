import { cleanAreaName } from '@common/util/cleanAreaName';
import { cleanCityName } from '@common/util/cleanCityName';
import { EMS_AMBULANCE_COMPANY_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Auth } from '@src/auth/interface';
import { EmsAmbulanceCompanyRequest } from '@src/types/ems.request.dto';
import typia from 'typia';
import { EmsAmbulanceCompany } from '../interface/ems/ems.ambulanceCompany.interface';
import { PrismaService } from './../../common/prisma/prisma.service';

@Injectable()
export class EmsAmbulanceCampanyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAmbulanceCompanyList(query: EmsAmbulanceCompanyRequest.GetAmbulanceCompanyListQuery) {
    const { page = 1, limit = 10, search = '', city = [], area = [], ambulance_type = [] } = query;
    const skip = (page - 1) * limit;

    // 입력된 지역명을 정제하여 중복을 제거한다.
    // 예) '서울시 강남구' -> '서울강남'
    const cleanedAreaSet = area.map((a) => cleanAreaName(a));
    const cleanedCitySet = city.map((a) => cleanCityName(a));

    //레디스 캐시화 필요
    const db_areas =
      cleanedAreaSet.length > 0
        ? await this.prismaService.ems_AmbulanceCompany.groupBy({
            by: ['ambulance_company_area'],
          })
        : [];

    const filteredAreas =
      cleanedAreaSet.length > 0
        ? db_areas
            .filter((a) => cleanedAreaSet.some((b) => cleanAreaName(a.ambulance_company_area).includes(b)))
            .map((a) => a.ambulance_company_area)
        : [];

    const where: Prisma.ems_AmbulanceCompanyFindManyArgs['where'] = {
      ambulance_company_name: {
        contains: search,
      },
      ...(filteredAreas.length > 0 && {
        ambulance_company_area: {
          in: filteredAreas,
        },
      }),
      ...(cleanedCitySet.length > 0 && {
        ambulance_company_address: {
          in: cleanedCitySet,
        },
      }),
      ...(ambulance_type.length > 0 && {
        ambulances: {
          some: {
            ambulance_type: {
              in: ambulance_type,
            },
          },
        },
      }),
    };

    const arg: Prisma.ems_AmbulanceCompanyFindManyArgs = {
      skip,
      take: limit,
      where,
    };

    const ambulance_company_list = await this.prismaService.ems_AmbulanceCompany.findMany(arg);
    const ambulance_company_count = await this.prismaService.ems_AmbulanceCompany.count({
      where,
    });

    return {
      ambulance_company_list,
      count: ambulance_company_count,
    };
  }

  async getAmbulanceCompanyDetail(
    ems_ambulance_company_id: string,
    user?: Auth.CommonPayload,
  ): Promise<
    EmsAmbulanceCompany.GetAmbulanceCompanyDetailReturn | EMS_AMBULANCE_COMPANY_ERROR.AMBULANCE_COMPANY_NOT_FOUND
  > {
    const ambulance_company = await this.prismaService.ems_AmbulanceCompany.findUnique({
      where: {
        ambulance_company_id: ems_ambulance_company_id,
      },
      include: {
        ambulances: {
          include: {
            employees: {
              include: {
                employee: {
                  select: {
                    employee_id: true,
                    employee_name: true,
                    role: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ambulance_company) {
      return typia.random<EMS_AMBULANCE_COMPANY_ERROR.AMBULANCE_COMPANY_NOT_FOUND>();
    }

    const result = {
      ...ambulance_company,
      ambulances: ambulance_company.ambulances.map((ambulance) => ({
        ...ambulance,
        employees:
          user && user._type === 'EMS' && ems_ambulance_company_id === user.ambulance_company_id
            ? ambulance.employees
            : [],
      })),
    };
    return result;
  }
}
