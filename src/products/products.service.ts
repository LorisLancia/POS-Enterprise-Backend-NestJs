import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { AssignModifierDto } from './dto/assign-modifier.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(storeId: number, dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          name: dto.name,
          categoryId: dto.categoryId,
          sku: dto.sku,
          basePrice: dto.basePrice,
          taxRate: dto.taxRate,
          trackInventory: dto.trackInventory ?? true,
          allowDecimalQty: dto.allowDecimalQty ?? false,
          variants: {
            create:
              dto.variants?.map((v) => ({
                name: v.name,
                sku: v.sku,
                priceAdjustment: v.priceAdjustment,
              })) || [],
          },
          recipes: {
            create:
              dto.recipes?.map((r) => ({
                materialId: r.materialId,
                variantId: r.variantId,
                quantity: r.quantity,
                unit: r.unit,
                wastagePercent: r.wastagePercent ?? 0,
              })) || [],
          },
        },
        include: {
          category: true,
          variants: true,
          recipes: { include: { material: true, variant: true } },
          modifiers: { include: { group: { include: { options: true } } } },
        },
      });

      if (dto.modifierGroupIds?.length) {
        await tx.productModifier.createMany({
          data: dto.modifierGroupIds.map((gid) => ({
            productId: product.id,
            groupId: gid,
            isRequired: false,
          })),
        });
      }

      // Rileggi con include completi (usando tx, non this.prisma)
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: true,
          recipes: { include: { material: true, variant: true } },
          modifiers: { include: { group: { include: { options: true } } } },
        },
      });
    });
  }

  async findAllByStore(storeId: number) {
    return this.prisma.product.findMany({
      where: { storeId },
      include: {
        category: true,
        variants: true,
        recipes: { include: { material: true, variant: true } },
        modifiers: { include: { group: { include: { options: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        recipes: { include: { material: true, variant: true } },
        modifiers: { include: { group: { include: { options: true } } } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        sku: dto.sku,
        basePrice: dto.basePrice,
        taxRate: dto.taxRate,
        trackInventory: dto.trackInventory,
        allowDecimalQty: dto.allowDecimalQty,
        isActive: dto.isActive,
      },
      include: {
        category: true,
        variants: true,
        recipes: { include: { material: true } },
        modifiers: { include: { group: { include: { options: true } } } },
      },
    });
  }

  async remove(id: number) {
    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Modifier Groups
  async createModifierGroup(storeId: number, dto: CreateModifierGroupDto) {
    return this.prisma.modifierGroup.create({
      data: {
        storeId,
        name: dto.name,
        selectionType: dto.selectionType,
        minSelect: dto.minSelect,
        maxSelect: dto.maxSelect,
        options: {
          create:
            dto.options?.map((o) => ({
              name: o.name,
              priceAdjustment: o.priceAdjustment ?? 0,
              materialId: o.materialId,
              quantityConsumed: o.quantityConsumed,
            })) || [],
        },
      },
      include: { options: true },
    });
  }

  async findAllModifierGroups(storeId: number) {
    return this.prisma.modifierGroup.findMany({
      where: { storeId },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignModifierToProduct(dto: AssignModifierDto) {
    return this.prisma.productModifier.create({
      data: {
        productId: dto.productId,
        groupId: dto.groupId,
        isRequired: dto.isRequired ?? false,
      },
    });
  }

  // POS Sync Endpoint
  async getProductsForPOS(storeId: number) {
    return this.prisma.product.findMany({
      where: { storeId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        recipes: { include: { material: true, variant: true } },
        modifiers: {
          include: {
            group: {
              include: {
                options: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });
  }
}
