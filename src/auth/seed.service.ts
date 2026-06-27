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

    // Resetta tutte le sequenze autoincrement per evitare conflitti P2002
    await this.resetSequences();

    return { message: 'Seed completed', companyId: company.id };
  }

  async resetSequences() {
    const tables = [
      'companies',
      'warehouses',
      'roles',
      'users',
      'user_sessions',
      'materials',
      'material_units',
      'products',
      'product_categories',
      'product_variants',
      'product_recipes',
      'modifier_groups',
      'modifier_options',
      'product_modifiers',
      'product_addons',
      'product_addon_items',
      'sale_item_addons',
      'inventory',
      'inventory_transactions',
      'suppliers',
      'purchase_orders',
      'po_items',
      'pos_clients',
      'shifts',
      'cash_movements',
      'sales',
      'sale_items',
      'sale_item_modifiers',
      'payments',
      'sync_metadata',
      'warehouse_transfers',
    ];

    for (const table of tables) {
      const seqName = `${table}_id_seq`;
      try {
        await this.prisma.$executeRawUnsafe(
          `SELECT setval('"${seqName}"', COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false);`,
        );
      } catch (e) {
        // Se la sequenza non esiste (tabella vuota o non autoincrement), ignora
      }
    }
  }
}
