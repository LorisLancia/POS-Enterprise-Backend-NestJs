import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePODto } from './dto/create-po.dto';
import { ReceivePODto } from './dto/receive-po.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-tx.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  // ==================== MATERIALS ====================
  async createMaterial(storeId: number, dto: CreateMaterialDto) {
    return this.prisma.material.create({
      data: {
        storeId,
        name: dto.name,
        unit: dto.unit,
        category: dto.category,
        costPerUnit: dto.costPerUnit ?? 0,
        minStock: dto.minStock,
      },
    });
  }

  async findAllMaterials(storeId: number) {
    return this.prisma.material.findMany({
      where: { storeId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ==================== SUPPLIERS ====================
  async createSupplier(storeId: number, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        storeId,
        name: dto.name,
        contact: dto.contact,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }

  async findAllSuppliers(storeId: number) {
    return this.prisma.supplier.findMany({
      where: { storeId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ==================== INVENTORY ====================
  async getInventoryByWarehouse(warehouseId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouseId },
      include: { material: true },
      orderBy: { material: { name: 'asc' } },
    });
  }

  async getInventoryForPOS(warehouseId: number) {
    return this.prisma.inventory.findMany({
      where: { warehouseId },
      include: { material: { select: { id: true, name: true, unit: true } } },
    });
  }

  async createInventoryTransaction(
    userId: number,
    dto: CreateInventoryTransactionDto,
  ) {
    const { warehouseId, materialId, type, quantity } = dto;

    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) throw new NotFoundException('Material not found');

    const outgoingTypes = ['sale', 'transfer_out', 'waste'];
    if (outgoingTypes.includes(type)) {
      const inv = await this.prisma.inventory.findUnique({
        where: { warehouseId_materialId: { warehouseId, materialId } },
      });
      if (!inv || inv.quantity.toNumber() < quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${material.name}. Available: ${inv?.quantity.toNumber() ?? 0}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          warehouseId,
          materialId,
          type,
          quantity,
          unitCost: dto.unitCost,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      const delta = outgoingTypes.includes(type) ? -quantity : quantity;

      await tx.inventory.upsert({
        where: { warehouseId_materialId: { warehouseId, materialId } },
        update: { quantity: { increment: delta } },
        create: { warehouseId, materialId, quantity: delta },
      });

      return transaction;
    });
  }

  // ==================== PURCHASE ORDERS ====================
  async createPurchaseOrder(storeId: number, userId: number, dto: CreatePODto) {
    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    return this.prisma.purchaseOrder.create({
      data: {
        warehouseId: dto.warehouseId,
        supplierId: dto.supplierId,
        status: 'draft',
        total,
        notes: dto.notes,
        createdBy: userId,
        items: {
          create: dto.items.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: { include: { material: true } } },
    });
  }

  async findAllPurchaseOrders(storeId: number) {
    return this.prisma.purchaseOrder.findMany({
      where: { warehouse: { storeId } },
      include: {
        items: { include: { material: true } },
        supplier: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async receivePurchaseOrder(poId: number, userId: number, dto: ReceivePODto) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });
      if (!po) throw new NotFoundException('Purchase Order not found');

      for (const item of dto.items) {
        const poItem = po.items.find((i) => i.id === item.poItemId);
        if (!poItem) continue;

        const newReceived = poItem.receivedQty.toNumber() + item.receivedQty;
        if (newReceived > poItem.quantity.toNumber()) {
          throw new BadRequestException(`Over-receive for item ${poItem.id}`);
        }

        await tx.pOItem.update({
          where: { id: item.poItemId },
          data: { receivedQty: newReceived },
        });

        await tx.inventoryTransaction.create({
          data: {
            warehouseId: po.warehouseId,
            materialId: poItem.materialId,
            type: 'purchase',
            quantity: item.receivedQty,
            unitCost: poItem.unitPrice,
            referenceId: poId,
            referenceType: 'purchase_order',
            createdBy: userId,
          },
        });

        await tx.inventory.upsert({
          where: {
            warehouseId_materialId: {
              warehouseId: po.warehouseId,
              materialId: poItem.materialId,
            },
          },
          update: { quantity: { increment: item.receivedQty } },
          create: {
            warehouseId: po.warehouseId,
            materialId: poItem.materialId,
            quantity: item.receivedQty,
          },
        });
      }

      const allItems = await tx.pOItem.findMany({ where: { poId } });
      const totalReceived = allItems.reduce(
        (sum, i) => sum + i.receivedQty.toNumber(),
        0,
      );
      const totalOrdered = allItems.reduce(
        (sum, i) => sum + i.quantity.toNumber(),
        0,
      );
      const newStatus = totalReceived >= totalOrdered ? 'received' : 'partial';

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus },
      });

      return tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: { include: { material: true } }, supplier: true },
      });
    });
  }

  // ==================== TRANSFERS ====================
  async createTransfer(
    storeId: number,
    userId: number,
    dto: CreateTransferDto,
  ) {
    const fromWh = await this.prisma.warehouse.findUnique({
      where: { id: dto.fromWarehouseId },
    });
    const toWh = await this.prisma.warehouse.findUnique({
      where: { id: dto.toWarehouseId },
    });

    if (
      !fromWh ||
      !toWh ||
      fromWh.storeId !== storeId ||
      toWh.storeId !== storeId
    ) {
      throw new NotFoundException('Warehouse not found in this store');
    }

    return this.prisma.warehouseTransfer.create({
      data: {
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        status: 'pending',
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async findAllTransfers(storeId: number) {
    return this.prisma.warehouseTransfer.findMany({
      where: {
        OR: [{ fromWarehouse: { storeId } }, { toWarehouse: { storeId } }],
      },
      include: { fromWarehouse: true, toWarehouse: true, createdByUser: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async completeTransfer(transferId: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.warehouseTransfer.findUnique({
        where: { id: transferId },
      });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'pending')
        throw new BadRequestException('Transfer already processed');

      await tx.warehouseTransfer.update({
        where: { id: transferId },
        data: { status: 'completed', completedAt: new Date() },
      });

      return { message: 'Transfer completed successfully', transferId };
    });
  }
}
