import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    const company = await this.prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Default Company',
        timezone: 'Asia/Bangkok',
        currency: 'THB',
      },
    });

    const warehouse = await this.prisma.warehouse.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        companyId: company.id,
        name: 'Main Warehouse',
      },
    });

    const role = await this.prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'admin',
        permissions: ['*'],
        description: 'Full access',
      },
    });

    await this.prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        companyId: company.id,
        roleId: role.id,
        username: 'admin',
        pinHash: '$2b$10$QvYEE3BlJzQCKipbCuQfsOFAHZC2kZElffilaycb4397grMKsbmPy',
        fullName: 'Administrator',
        isActive: true,
      },
    });

    // ❌ RIMOSSO: il POSClient viene creato dal wizard, non dal seed
    // await this.prisma.pOSClient.upsert({ ... });

    return { message: 'Seed completed', companyId: company.id };
  }
}
