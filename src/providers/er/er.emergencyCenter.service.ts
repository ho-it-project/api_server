import { PrismaService } from '@common/prisma/prisma.service';
import { calculateDistance } from '@common/util/calculateDistance';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErEmergencyCenter } from '../interface/er/er.emergencyCenter.interface';

@Injectable()
export class ErEmergencyCenterService {
  constructor(private readonly prismaService: PrismaService) {}

  // TODO : redis cache 적용
  async getEmergencyCenterListByQuery(
    query: ErEmergencyCenter.GetEmergencyCenterListQuery,
  ): Promise<ErEmergencyCenter.GetEmergencyCenterListQueryReturn> {
    const { emergency_center_type, emergency_room_available, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const { city = '' } = query;
    const { latitude, longitude } = query;

    const emergency_center_type_where = emergency_center_type
      ? {
          emergency_center_type: {
            in: emergency_center_type,
          },
        }
      : {};
    const emergency_room_available_where = emergency_room_available
      ? {
          emergency_rooms: {
            some: {
              emergency_room_type: {
                in: emergency_room_available,
              },
            },
          },
        }
      : {};
    // // query
    const where: Prisma.er_EmergencyCenterFindManyArgs['where'] = {
      AND: [
        {
          hospital: {
            hospital_city: {
              contains: city,
            },
          },
        },
        emergency_center_type_where,
        emergency_room_available_where,
      ],
    };
    const emergencyCenterList = await this.prismaService.er_EmergencyCenter.findMany({
      where,
      include: {
        hospital: true,
        emergency_rooms: {
          include: {
            emergency_room_beds: true,
            _count: true,
          },
        },
      },
    });
    // // location query

    // const emergency_center_list = this.sortEmergencyCenterListByDistance(
    //   latitude,
    //   longitude,
    //   emergencyCenterList,
    // ).slice(skip, skip + limit);
    const emergency_center_list = this.sortEmergencyCenterListByDistance({
      latitude,
      longitude,
      emergencyCenterList,
    }).slice(skip, skip + limit);

    const emergency_center_count = emergencyCenterList.length;
    return { emergency_center_list, count: emergency_center_count };
  }

  /**
   * 사용하지않지만 변경된점을 알기위해 남겨둠 지워질 예정
   */
  // sortEmergencyCenterListByDistance<T extends er_EmergencyCenter>(
  //   latitude: number,
  //   longitude: number,
  //   emergencyCenterList: T[],
  // ): (T & { distance: number })[] {
  //   const sortedEmergencyCenterList = emergencyCenterList
  //     .map((emergencyCenter) => {
  //       return {
  //         ...emergencyCenter,
  //         distance: calculateDistance(
  //           latitude,
  //           longitude,
  //           emergencyCenter.emergency_center_latitude,
  //           emergencyCenter.emergency_center_longitude,
  //         ),
  //       };
  //     })
  //     .sort((a, b) => a.distance - b.distance);
  //   return sortedEmergencyCenterList;
  // }

  sortEmergencyCenterListByDistance: ErEmergencyCenter.SortEmergencyCenterListByDistance = ({
    latitude,
    longitude,
    emergencyCenterList,
  }) => {
    const sortedEmergencyCenterList = emergencyCenterList
      .map((emergencyCenter) => {
        return {
          ...emergencyCenter,
          distance: calculateDistance(
            latitude,
            longitude,
            emergencyCenter.emergency_center_latitude,
            emergencyCenter.emergency_center_longitude,
          ),
        };
      })
      .sort((a, b) => a.distance - b.distance);
    return sortedEmergencyCenterList;
  };
}
