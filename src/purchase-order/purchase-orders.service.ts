import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseOrderDto) {
    const { warehouseId, supplierId, createdBy, notes, items } = dto;

    // Verifica supplier appartenga alla stessa company del warehouse
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { company: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.companyId !== warehouse.companyId) {
      throw new BadRequestException(
        'Supplier does not belong to the same company',
      );
    }

    // Calcola totale
    let total = 0;
    for (const item of items) {
      const material = await this.prisma.material.findUnique({
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

      total += item.quantity * item.unitPrice;
    }

    return this.prisma.purchaseOrder.create({
      data: {
        warehouseId,
        supplierId,
        createdBy,
        notes,
        total,
        status: 'draft',
        items: {
          create: items.map((item) => ({
            materialId: item.materialId,
            unit: 'PC' as any, // Sostituire con lookup da unitId
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            receivedQty: 0,
          })),
        },
      },
      include: { items: { include: { material: true } }, supplier: true },
    });
  }

  async findAll(warehouseId: number) {
    return this.prisma.purchaseOrder.findMany({
      where: { warehouseId },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { material: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { material: true } },
        user: { select: { fullName: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async update(id: number, dto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(id);
    if (po.status !== 'draft') {
      throw new BadRequestException('Cannot update a non-draft purchase order');
    }

    const { items } = dto;
    const warehouseId = dto.warehouseId ?? po.warehouseId;
    const supplierId = dto.supplierId ?? po.supplierId;

    // Se ci sono items, sostituiamo tutti (delete + create in transazione)
    if (items && items.length > 0) {
      return this.prisma.$transaction(async (tx) => {
        // 1. Cancella item esistenti
        await tx.pOItem.deleteMany({ where: { poId: id } });

        // 2. Calcola totale e prepara nuovi item con unità reali
        let total = 0;
        const createItems: any[] = [];

        for (const item of items) {
          const material = await tx.material.findUnique({
            where: { id: item.materialId },
            include: { units: true },
          });
          if (!material) {
            throw new NotFoundException(
              `Material ${item.materialId} not found`,
            );
          }

          const unit = material.units.find((u: any) => u.id === item.unitId);
          if (!unit) {
            throw new NotFoundException(
              `Unit ${item.unitId} not found for material ${item.materialId}`,
            );
          }

          total += item.quantity * item.unitPrice;
          createItems.push({
            materialId: item.materialId,
            unit: unit.unit, // <-- FIX: usa l'unità reale dal DB, non 'PC'
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            receivedQty: 0,
          });
        }

        // 3. Aggiorna il PO con i nuovi item
        return tx.purchaseOrder.update({
          where: { id },
          data: {
            warehouseId,
            supplierId,
            notes: dto.notes,
            total,
            items: { create: createItems },
          },
          include: { items: { include: { material: true } }, supplier: true },
        });
      });
    }

    // Nessun item, aggiorna solo i campi base
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        warehouseId,
        supplierId,
        notes: dto.notes,
      },
      include: { items: { include: { material: true } }, supplier: true },
    });
  }

  async receive(id: number, dto: ReceivePurchaseOrderDto) {
    const po = await this.findOne(id);
    if (po.status === 'received') {
      throw new BadRequestException('Purchase order already fully received');
    }
    if (po.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot receive a cancelled purchase order',
      );
    }

    const { receivedBy, items } = dto;

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const poItem = po.items.find((i) => i.id === item.poItemId);
        if (!poItem)
          throw new NotFoundException(`PO Item ${item.poItemId} not found`);

        const newReceived = Number(poItem.receivedQty) + item.receivedQty;
        if (newReceived > Number(poItem.quantity)) {
          throw new BadRequestException(
            `Received quantity (${newReceived}) exceeds ordered quantity (${poItem.quantity}) for item ${poItem.material.name}`,
          );
        }

        // 1. Aggiorna receivedQty sul POItem
        await tx.pOItem.update({
          where: { id: item.poItemId },
          data: { receivedQty: newReceived },
        });

        // 2. Crea InventoryTransaction PURCHASE
        await tx.inventoryTransaction.create({
          data: {
            warehouseId: po.warehouseId,
            materialId: poItem.materialId,
            type: 'PURCHASE',
            unit: poItem.unit,
            quantity: item.receivedQty,
            unitCost: item.unitCost,
            referenceId: id,
            referenceType: 'PURCHASE_ORDER',
            notes: `Received from PO #${id}`,
            createdBy: receivedBy,
          },
        });

        // 3. Upsert Inventory
        await tx.inventory.upsert({
          where: {
            warehouseId_materialId_unit: {
              warehouseId: po.warehouseId,
              materialId: poItem.materialId,
              unit: poItem.unit,
            },
          },
          update: {
            quantity: { increment: item.receivedQty },
          },
          create: {
            warehouseId: po.warehouseId,
            materialId: poItem.materialId,
            unit: poItem.unit,
            quantity: item.receivedQty,
            reservedQuantity: 0,
          },
        });

        // 4. Aggiorna lastPurchasePrice
        await tx.material.update({
          where: { id: poItem.materialId },
          data: { lastPurchasePrice: item.unitCost },
        });
      }

      // 5. Aggiorna status PO
      const updatedItems = await tx.pOItem.findMany({ where: { poId: id } });
      const allReceived = updatedItems.every(
        (i) => Number(i.receivedQty) >= Number(i.quantity),
      );
      const anyReceived = updatedItems.some((i) => Number(i.receivedQty) > 0);

      const newStatus = allReceived
        ? 'received'
        : anyReceived
          ? 'partial'
          : 'draft';

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
        include: { items: { include: { material: true } }, supplier: true },
      });
    });
  }

  async cancel(id: number) {
    const po = await this.findOne(id);
    if (po.status === 'received') {
      throw new BadRequestException(
        'Cannot cancel a fully received purchase order',
      );
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { items: { include: { material: true } }, supplier: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
