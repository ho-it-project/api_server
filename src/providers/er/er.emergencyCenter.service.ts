import { PrismaService } from '@common/prisma/prisma.service';
import { sortByDistanceFromCurrentLocation } from '@common/util/sortByDistanceFromCurrentLocation';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { RedisStore } from 'cache-manager-redis-store';
import { ErEmergencyCenter } from '../interface/er/er.emergencyCenter.interface';
@Injectable()
export class ErEmergencyCenterService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache & RedisStore,
  ) {}

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

    //cache key
    const key = Buffer.from(JSON.stringify({ where, latitude, longitude })).toString('base64');
    // cache get
    const cached = await this.cache.get<ErEmergencyCenter.GetEmergentcyCenterListQueryFindManyOuputWithDistance>(key);
    if (cached) {
      console.log('cache hit');
      const cached_emergency_center_list = <ErEmergencyCenter.GetEmergentcyCenterListQueryFindManyOuputWithDistance>(
        cached
      );
      const cached_emergency_center_count = cached.length;
      return {
        emergency_center_list: cached_emergency_center_list.slice(skip, skip + limit),
        count: cached_emergency_center_count,
      };
    }
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

    // location query
    const sorted_emergency_center_list = sortByDistanceFromCurrentLocation({
      latitude,
      longitude,
      list: emergencyCenterList,
      objLatitudeKey: 'emergency_center_latitude',
      objLongitudeKey: 'emergency_center_longitude',
    });
    // cache set
    await this.cache.set(key, sorted_emergency_center_list, { ttl: 60 } as any);
    const emergency_center_list = sorted_emergency_center_list.slice(skip, skip + limit);
    const emergency_center_count = emergencyCenterList.length;
    return { emergency_center_list, count: emergency_center_count };
  }
}
