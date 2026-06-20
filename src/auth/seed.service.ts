import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    // 1. Company
    const company = await this.prisma.company.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'POS Enterprise Co.',
        taxId: 'TH123456789',
      },
    });

    // 2. Store
    const store = await this.prisma.store.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        companyId: company.id,
        name: 'Main Store',
        timezone: 'Asia/Bangkok',
        currency: 'THB',
      },
    });

    // 3. Warehouse
    const warehouse = await this.prisma.warehouse.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeId: store.id,
        name: 'Main Warehouse',
        type: 'main',
      },
    });

    // 4. POS Client
    const posClient = await this.prisma.pOSClient.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeId: store.id,
        name: 'POS Terminal 1',
        location: 'Main Counter',
        hardwareId: 'DUMMY-HARDWARE-ID-001',
      },
    });

    // 5. Role Master Admin
    const role = await this.prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Master Admin',
        permissions: ['*'],
        description: 'Full access to all features',
      },
    });

    // 6. Admin User (PIN: 123456)
    const pinHash = await bcrypt.hash('123456', 10);
    const user = await this.prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeId: store.id,
        roleId: role.id,
        username: 'admin',
        pinHash,
        fullName: 'Administrator',
        isActive: true,
      },
    });

    return {
      message: 'Seed completed successfully',
      company: company.name,
      store: store.name,
      warehouse: warehouse.name,
      posClient: posClient.name,
      role: role.name,
      user: user.username,
      defaultPin: '123456',
    };
  }
}
