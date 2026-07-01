import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStartingBalanceDto } from './dto/create-starting-balance.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createStartingBalance(dto: CreateStartingBalanceDto) {
    const { warehouseId, createdBy, items } = dto;

    // Verifica warehouse esista
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const transactions = [];

      for (const item of items) {
        const material = await tx.material.findUnique({
          where: { id: item.materialId },
          include: { units: true },
        });
        if (!material) throw new NotFoundException(`Material ${item.materialId} not found`);

        const unit = material.units.find(u => u.id === item.unitId);
        if (!unit) throw new NotFoundException(`Unit ${item.unitId} not found for material ${item.materialId}`);

        // 1. Crea InventoryTransaction OPENING_BALANCE
        const transaction = await tx.inventoryTransaction.create({
          data: {
            warehouseId,
            materialId: item.materialId,
            type: 'OPENING_BALANCE',
            unit: unit.unit, // StandardUnit enum
            quantity: item.quantity,
            unitCost: item.unitCost,
            notes: item.notes || 'Migrazione giacenza iniziale',
            createdBy,
          },
        });
        transactions.push(transaction);

        // 2. Upsert Inventory (giacenza attuale)
        await tx.inventory.upsert({
          where: {
            warehouseId_materialId_unit: {
              warehouseId,
              materialId: item.materialId,
              unit: unit.unit,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            warehouseId,
            materialId: item.materialId,
            unit: unit.unit,
            quantity: item.quantity,
            reservedQuantity: 0,
          },
        });

        // 3. Aggiorna lastPurchasePrice su Material
        await tx.material.update({
          where: { id: item.materialId },
          data: { lastPurchasePrice: item.unitCost },
        });
      }

      return transactions;
    });

    return {
      message: 'Starting balance created successfully',
      transactionsCreated: result.length,
      transactions: result,
    };
  }

  async getInventoryByWarehouse(warehouseId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouseId },
      include: { material: true },
      orderBy: { material: { name: 'asc' } },
    });
  }

  async getInventoryByCompany(companyId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouse: { companyId } },
      include: { material: true, warehouse: true },
      orderBy: [{ warehouse: { name: 'asc' } }, { material: { name: 'asc' } }],
    });
  }

  async getInventoryTransactions(warehouseId: number) {
    return this.prisma.inventoryTransaction.findMany({
      where: { warehouseId },
      include: { material: true, user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
