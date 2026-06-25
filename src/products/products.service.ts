import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { AssignModifierDto } from './dto/assign-modifier.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(companyId: number, dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId,
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
                unitId: r.unitId,
                wastagePercent: r.wastagePercent ?? 0,
              })) || [],
          },
          addons: {
            create:
              dto.addons?.map((a) => ({
                name: a.name,
                maxQuantity: a.maxQuantity ?? 0,
                sortOrder: a.sortOrder ?? 0,
                items: {
                  create:
                    a.items?.map(
                      (item: {
                        addonProductId: number;
                        quantityValue?: number;
                        sortOrder?: number;
                      }) => ({
                        addonProductId: item.addonProductId,
                        quantityValue: item.quantityValue ?? 1,
                        sortOrder: item.sortOrder ?? 0,
                      }),
                    ) || [],
                },
              })) || [],
          },
        },
        include: {
          category: true,
          variants: true,
          recipes: {
            include: {
              material: true,
              variant: true, // AGGIUNGI
              unit: true, // AGGIUNGI
            },
          },
          modifiers: { include: { group: { include: { options: true } } } },
          addons: {
            include: {
              items: {
                include: { addonProduct: true },
              },
            },
          },
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

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: true,
          recipes: { include: { material: true, variant: true, unit: true } },
          modifiers: { include: { group: { include: { options: true } } } },
          addons: {
            include: {
              items: {
                include: { addonProduct: true },
              },
            },
          },
        },
      });
    });
  }

  async findAllByStore(companyId: number) {
    return this.prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
        variants: true,
        recipes: { include: { material: true, variant: true, unit: true } },
        modifiers: { include: { group: { include: { options: true } } } },
        addons: {
          where: { isActive: true },
          include: {
            items: {
              where: { isActive: true },
              include: { addonProduct: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
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
        recipes: { include: { material: true, variant: true, unit: true } },
        modifiers: { include: { group: { include: { options: true } } } },
        addons: {
          where: { isActive: true },
          include: {
            items: {
              where: { isActive: true },
              include: { addonProduct: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
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
        recipes: { include: { material: true, unit: true } },
        modifiers: { include: { group: { include: { options: true } } } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Modifier Groups
  async createModifierGroup(companyId: number, dto: CreateModifierGroupDto) {
    return this.prisma.modifierGroup.create({
      data: {
        companyId,
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

  async findAllModifierGroups(companyId: number) {
    return this.prisma.modifierGroup.findMany({
      where: { companyId },
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
  async getProductsForPOS(companyId: number) {
    return this.prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        recipes: { include: { material: true, variant: true, unit: true } },
        modifiers: {
          include: {
            group: {
              include: {
                options: { where: { isActive: true } },
              },
            },
          },
        },
        addons: {
          where: { isActive: true },
          include: {
            items: {
              where: { isActive: true },
              include: { addonProduct: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }
}
