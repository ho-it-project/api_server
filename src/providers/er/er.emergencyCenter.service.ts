import { PrismaService } from '@common/prisma/prisma.service';
import { sortByDistanceFromCurrentLocation } from '@common/util/sortByDistanceFromCurrentLocation';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, er_EmergencyCenter } from '@prisma/client';
import { Cache } from 'cache-manager';

import { ER_EMERGENCY_CENTER_ERROR } from '@config/errors';
import { RedisStore } from 'cache-manager-redis-store';
import typia from 'typia';
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
    const { emergency_center_type, emergency_room_available, page = 1, limit = 10, search = '' } = query;

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
    const search_where = {
      emergency_center_name: {
        contains: search,
      },
    };
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
        search_where,
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

  async getEmergencyCenterListAll() {
    const cached_emergency_center_list = await this.cache.get<er_EmergencyCenter[]>('emergency_center_list');
    const emergencyCenterList =
      cached_emergency_center_list || (await this.prismaService.er_EmergencyCenter.findMany({}));

    if (!cached_emergency_center_list) {
      await this.cache.set('emergency_center_list', emergencyCenterList, { ttl: 24 * 60 * 60 } as any); // 거의 변하지 않는 데이터 24시간
    }
    return emergencyCenterList;
  }

  async getSortedEmergencyCenterListByDistanceFromCurrentLocation({
    latitude,
    longitude,
    ttl = 15 * 60,
  }: {
    latitude: number;
    longitude: number;
    ttl?: number;
  }) {
    const key = `sorted_emergency_center_list_${latitude}_${longitude}`;
    const cached = await this.cache.get<(er_EmergencyCenter & { distance: number })[]>(key);
    if (!cached) {
      const emergencyCenterList = await this.getEmergencyCenterListAll();
      const sorted_emergency_center_list = sortByDistanceFromCurrentLocation({
        latitude,
        longitude: longitude,
        list: emergencyCenterList,
        objLatitudeKey: 'emergency_center_latitude',
        objLongitudeKey: 'emergency_center_longitude',
      });
      await this.cache.set(key, sorted_emergency_center_list, { ttl } as any);
      return sorted_emergency_center_list;
    }
    return cached;
  }

  async getEmergencyCenterById(emergency_center_id: string) {
    const emergencyCenter = await this.prismaService.er_EmergencyCenter.findUnique({
      where: {
        emergency_center_id,
      },
      include: {
        hospital: {
          include: {
            hospital_departments: { include: { department: true } },
            hospital_medical_equipment: { include: { medical_equipment: true } },
            hospital_servere_illness: { include: { servere_illness: true } },
          },
        },
        emergency_rooms: {
          include: {
            emergency_room_beds: true,
            _count: true,
          },
        },
      },
    });
    if (!emergencyCenter) return typia.random<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND>();

    return emergencyCenter;
  }
}
