import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(warehouseId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouseId },
      include: { material: { include: { units: true } } },
    });
  }

  async getInventoryByMaterial(warehouseId: number, materialId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouseId, materialId },
      include: { material: { include: { units: true } } },
    });
  }

  async createTransaction(
    createdBy: number,
    dto: CreateInventoryTransactionDto,
  ) {
    const { warehouseId, materialId, unit, quantity, type } = dto;
    const qty = parseFloat(quantity);

    // Crea la transazione
    const tx = await this.prisma.inventoryTransaction.create({
      data: {
        warehouseId,
        materialId,
        type,
        unit,
        quantity: qty,
        unitCost: dto.unitCost ? parseFloat(dto.unitCost) : null,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        notes: dto.notes,
        createdBy,
      },
    });

    // Aggiorna l'inventario
    const existing = await this.prisma.inventory.findUnique({
      where: {
        warehouseId_materialId_unit: { warehouseId, materialId, unit },
      },
    });

    if (existing) {
      const currentQty = existing.quantity as unknown as number;
      const newQty = type === 'in' ? currentQty + qty : currentQty - qty;

      await this.prisma.inventory.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else if (type === 'in') {
      await this.prisma.inventory.create({
        data: {
          warehouseId,
          materialId,
          unit,
          quantity: qty,
        },
      });
    }

    return tx;
  }

  async getTransactions(warehouseId: number, materialId?: number) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        warehouseId,
        ...(materialId && { materialId }),
      },
      include: { material: { include: { units: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
