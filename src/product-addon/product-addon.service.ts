import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductAddonDto } from './dto/create-product-addon.dto';
import { UpdateProductAddonDto } from './dto/update-product-addon.dto';

@Injectable()
export class ProductAddonService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateProductAddonDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || product.companyId !== companyId) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productAddon.create({
      data: {
        productId: dto.productId,
        name: dto.name,
        maxQuantity: dto.maxQuantity ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        items: {
          create: dto.items.map((item) => ({
            addonProductId: item.addonProductId,
            quantityValue: item.quantityValue ?? 1,
            price: item.price ?? 0,
            sortOrder: item.sortOrder ?? 0,
          })),
        },
      },
      include: {
        items: {
          include: { addonProduct: true },
        },
      },
    });
  }

  async findAllByProduct(productId: number) {
    return this.prisma.productAddon.findMany({
      where: { productId, isActive: true },
      include: {
        items: {
          where: { isActive: true },
          include: { addonProduct: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const addon = await this.prisma.productAddon.findUnique({
      where: { id },
      include: {
        items: {
          include: { addonProduct: true },
        },
      },
    });
    if (!addon) throw new NotFoundException('ProductAddon not found');
    return addon;
  }

  async update(id: number, dto: UpdateProductAddonDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.productAddon.update({
        where: { id },
        data: {
          name: dto.name,
          maxQuantity: dto.maxQuantity,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      if (dto.items) {
        await tx.productAddonItem.deleteMany({
          where: { addonId: id },
        });

        if (dto.items.length > 0) {
          await tx.productAddonItem.createMany({
            data: dto.items.map((item) => ({
              addonId: id,
              addonProductId: item.addonProductId,
              quantityValue: item.quantityValue ?? 1,
              price: dto.price ?? 0,
              sortOrder: item.sortOrder ?? 0,
            })),
          });
        }
      }

      return tx.productAddon.findUnique({
        where: { id },
        include: {
          items: {
            include: { addonProduct: true },
          },
        },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.productAddon.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
