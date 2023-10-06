import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReqEmsToErService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEmsToErRequest() {
    this.prismaService;
  }
}
