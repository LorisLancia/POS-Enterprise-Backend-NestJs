import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(companyId: number, userId: number, dto: CreateSaleDto) {
    console.log('>>> createSale called', {
      companyId,
      userId,
      posClientId: dto.posClientId,
      shiftId: dto.shiftId,
      clientSaleId: dto.clientSaleId,
    });

    // Controllo duplicati
    if (dto.clientSaleId) {
      const existing = await this.prisma.sale.findUnique({
        where: { clientSaleId: dto.clientSaleId },
      });
      if (existing) {
        console.log(
          '>>> Duplicate sale detected, returning existing:',
          existing.id,
        );
        return this.prisma.sale.findUnique({
          where: { id: existing.id },
          include: { items: { include: { modifiers: true } }, payments: true },
        });
      }
    }

    // TROVA O CREA shift
    let shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, posClientId: dto.posClientId, status: 'open' },
      include: { posClient: true },
    });

    if (!shift) {
      shift = await this.prisma.shift.findFirst({
        where: { posClientId: dto.posClientId, status: 'open' },
        include: { posClient: true },
      });
    }

    if (!shift) {
      console.log('>>> Creating new shift automatically');
      shift = await this.prisma.shift.create({
        data: {
          posClientId: dto.posClientId,
          userId: userId,
          startingCash: dto.startingCash ?? 0,
          status: 'open',
        },
        include: { posClient: true },
      });
      console.log('>>> New shift created with ID:', shift.id);
    }

    if (shift.posClient.companyId !== companyId) {
      throw new BadRequestException('Shift does not belong to this store');
    }

    const serverShiftId = shift.id;

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const saleItemsData: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true, recipes: true },
      });
      if (!product || !product.isActive) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const variant = item.variantId
        ? product.variants.find((v: any) => v.id === item.variantId)
        : null;

      const unitPrice =
        item.unitPrice ??
        product.basePrice.toNumber() +
          (variant?.priceAdjustment?.toNumber() ?? 0);
      const itemTotal = unitPrice * item.quantity;
      const itemDiscount = item.discountAmount ?? 0;
      const itemSubtotal = itemTotal - itemDiscount;
      const taxRate = product.taxRate.toNumber() / 100;
      const itemTax = itemSubtotal * taxRate;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      const modifiersData: any[] = [];
      let modifiersTotal = 0;

      if (item.modifiers?.length) {
        for (const mod of item.modifiers) {
          const option = await this.prisma.modifierOption.findUnique({
            where: { id: mod.modifierOptionId },
          });
          if (!option || !option.isActive) continue;
          const modPrice =
            option.priceAdjustment.toNumber() * (mod.quantity ?? 1);
          modifiersTotal += modPrice;
          modifiersData.push({
            modifierOptionId: mod.modifierOptionId,
            quantity: mod.quantity ?? 1,
            priceAdjustment: modPrice,
          });
        }
      }

      saleItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemSubtotal + modifiersTotal,
        costAtSale: 0,
        discountAmount: itemDiscount,
        modifiers: { create: modifiersData },
      });
    }

    const discountTotal = dto.discountTotal ?? 0;
    const total = subtotal + totalTax - discountTotal;

    const paymentTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentTotal - total) > 0.01) {
      throw new BadRequestException(
        `Payment total (${paymentTotal}) does not match sale total (${total})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.sale.count({ where: { companyId } });
      const saleNumber = `S${companyId}-${String(count + 1).padStart(6, '0')}`;

      console.log(
        '>>> Creating sale with saleNumber:',
        saleNumber,
        'shiftId:',
        serverShiftId,
        'clientSaleId:',
        dto.clientSaleId,
      );

      const sale = await tx.sale.create({
        data: {
          companyId,
          warehouseId: dto.warehouseId,
          posClientId: dto.posClientId,
          shiftId: serverShiftId,
          userId,
          saleNumber,
          subtotal,
          taxTotal: totalTax,
          discountTotal,
          total,
          customerCount: dto.customerCount,
          tableNumber: dto.tableNumber,
          notes: dto.notes,
          clientSaleId: dto.clientSaleId,
          items: {
            create: saleItemsData.map((sid: any) => ({
              productId: sid.productId,
              variantId: sid.variantId,
              quantity: sid.quantity,
              unitPrice: sid.unitPrice,
              totalPrice: sid.totalPrice,
              costAtSale: sid.costAtSale,
              discountAmount: sid.discountAmount,
              modifiers: sid.modifiers,
            })),
          },
          payments: {
            create: dto.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference,
            })),
          },
        },
        include: { items: { include: { modifiers: true } }, payments: true },
      });

      // Deduct inventory
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipes: { include: { material: true } } },
        });
        if (!product?.trackInventory) continue;

        for (const recipe of product.recipes) {
          const qty = recipe.quantity.toNumber() * item.quantity;
          const wastage = recipe.wastagePercent?.toNumber() ?? 0;
          const totalQty = qty + (qty * wastage) / 100;

          await tx.inventoryTransaction.create({
            data: {
              warehouseId: dto.warehouseId,
              materialId: recipe.materialId,
              type: 'sale',
              quantity: totalQty,
              referenceId: sale.id,
              referenceType: 'sale',
              createdBy: userId,
            },
          });

          await tx.inventory.upsert({
            where: {
              warehouseId_materialId: {
                warehouseId: dto.warehouseId,
                materialId: recipe.materialId,
              },
            },
            update: { quantity: { decrement: totalQty } },
            create: {
              warehouseId: dto.warehouseId,
              materialId: recipe.materialId,
              quantity: -totalQty,
            },
          });
        }
      }

      console.log('>>> Sale created successfully:', sale.id, sale.saleNumber);
      return sale;
    });
  }

  async findAllByStore(companyId: number) {
    return this.prisma.sale.findMany({
      where: { companyId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            modifiers: { include: { modifierOption: true } },
          },
        },
        payments: true,
        user: { select: { fullName: true } },
        posClient: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            modifiers: { include: { modifierOption: true } },
          },
        },
        payments: true,
        user: { select: { fullName: true } },
        posClient: true,
        shift: true,
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async openShift(posClientId: number, userId: number, startingCash: number) {
    const existing = await this.prisma.shift.findFirst({
      where: { posClientId, status: 'open' },
    });
    if (existing) {
      throw new BadRequestException(
        'There is already an open shift for this POS',
      );
    }
    return this.prisma.shift.create({
      data: { posClientId, userId, startingCash, status: 'open' },
    });
  }

  async closeShift(shiftId: number, userId: number, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: { sales: { include: { payments: true } } },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'open')
      throw new BadRequestException('Shift is already closed');

    const cashSales = shift.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const expectedCash = shift.startingCash.toNumber() + cashSales;

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'closed',
        closedAt: new Date(),
        expectedCash,
        actualCash: dto.actualCash,
        difference: dto.actualCash - expectedCash,
        notes: dto.notes,
      },
      include: { posClient: true, user: true, sales: true },
    });
  }

  async getShiftReport(shiftId: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        posClient: true,
        user: true,
        sales: {
          include: { items: { include: { product: true } }, payments: true },
        },
        cashMovements: true,
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    const totalSales = shift.sales.reduce(
      (sum, s) => sum + s.total.toNumber(),
      0,
    );
    const totalCash = shift.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalCard = shift.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === 'card')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    return {
      shift,
      summary: {
        totalSales,
        totalCash,
        totalCard,
        transactionCount: shift.sales.length,
      },
    };
  }

  async listShifts(companyId: number) {
    return this.prisma.shift.findMany({
      where: { posClient: { companyId } },
      include: { posClient: true, user: true, sales: true },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });
  }

  async getReport(from: Date, to: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shift: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalItems = sales.reduce(
      (sum, s) =>
        sum + s.items.reduce((iSum, i) => iSum + Number(i.quantity), 0),
      0,
    );
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      summary: {
        totalSales,
        totalRevenue,
        totalItems,
        averageTicket,
      },
      sales,
    };
  }
}
