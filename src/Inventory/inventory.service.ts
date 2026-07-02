import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStartingBalanceDto } from './dto/create-starting-balance.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';
import { StandardUnit } from '@prisma/client';

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
        if (!material)
          throw new NotFoundException(`Material ${item.materialId} not found`);

        const unit = material.units.find((u) => u.id === item.unitId);
        if (!unit)
          throw new NotFoundException(
            `Unit ${item.unitId} not found for material ${item.materialId}`,
          );

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
  async findAllStartingBalance(warehouseId: number) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        warehouseId,
        type: 'OPENING_BALANCE',
      },
      include: {
        material: true,
        warehouse: true,
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTransaction(id: number) {
    const tx = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        material: true,
        warehouse: true,
        user: { select: { fullName: true } },
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async updateTransaction(id: number, dto: UpdateInventoryTransactionDto) {
    const tx = await this.findOneTransaction(id);
    if (tx.type !== 'OPENING_BALANCE') {
      throw new BadRequestException(
        'Only OPENING_BALANCE transactions can be updated',
      );
    }

    return this.prisma.$transaction(async (txPrisma) => {
      // 1. Aggiorna la transazione
      const updated = await txPrisma.inventoryTransaction.update({
        where: { id },
        data: {
          materialId: dto.materialId,
          unit: dto.unit as StandardUnit,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          notes: dto.notes,
        },
        include: { material: true, warehouse: true },
      });

      // 2. Ricalcola l'inventory per questo materiale/unità
      const totalQty = await txPrisma.inventoryTransaction.aggregate({
        where: {
          warehouseId: tx.warehouseId,
          materialId: dto.materialId,
          unit: dto.unit as StandardUnit,
        },
        _sum: { quantity: true },
      });

      await txPrisma.inventory.upsert({
        where: {
          warehouseId_materialId_unit: {
            warehouseId: tx.warehouseId,
            materialId: dto.materialId,
            unit: dto.unit as StandardUnit,
          },
        },
        update: {
          quantity: totalQty._sum.quantity || 0,
        },
        create: {
          warehouseId: tx.warehouseId,
          materialId: dto.materialId,
          unit: dto.unit as StandardUnit,
          quantity: totalQty._sum.quantity || 0,
          reservedQuantity: 0,
        },
      });

      return updated;
    });
  }

  async removeTransaction(id: number) {
    const tx = await this.findOneTransaction(id);
    if (tx.type !== 'OPENING_BALANCE') {
      throw new BadRequestException(
        'Only OPENING_BALANCE transactions can be deleted',
      );
    }

    return this.prisma.$transaction(async (txPrisma) => {
      // 1. Elimina la transazione
      await txPrisma.inventoryTransaction.delete({ where: { id } });

      // 2. Ricalcola l'inventory (potrebbe diventare 0 o negativo, gestito)
      const totalQty = await txPrisma.inventoryTransaction.aggregate({
        where: {
          warehouseId: tx.warehouseId,
          materialId: tx.materialId,
          unit: tx.unit,
        },
        _sum: { quantity: true },
      });

      await txPrisma.inventory.upsert({
        where: {
          warehouseId_materialId_unit: {
            warehouseId: tx.warehouseId,
            materialId: tx.materialId,
            unit: tx.unit,
          },
        },
        update: {
          quantity: totalQty._sum.quantity || 0,
        },
        create: {
          warehouseId: tx.warehouseId,
          materialId: tx.materialId,
          unit: tx.unit,
          quantity: totalQty._sum.quantity || 0,
          reservedQuantity: 0,
        },
      });

      return { success: true };
    });
  }
}
