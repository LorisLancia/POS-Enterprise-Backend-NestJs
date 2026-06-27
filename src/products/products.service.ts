import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(companyId: number, dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crea prodotto base
      const product = await tx.product.create({
        data: {
          companyId,
          name: dto.name,
          categoryId: dto.categoryId,
          sku: dto.sku,
          basePrice: dto.basePrice,
          taxRate: dto.taxRate ?? 0,
          trackInventory: dto.trackInventory ?? true,
          allowDecimalQty: dto.allowDecimalQty ?? false,
        },
      });

      // 2. Crea varianti con ricette annidate
      if (dto.variants?.length) {
        for (const v of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              name: v.name,
              sku: v.sku,
              priceAdjustment: v.priceAdjustment ?? 0,
            },
          });

          // Ricette specifiche per questa variante
          if (v.recipes?.length) {
            await tx.productRecipe.createMany({
              data: v.recipes.map((r) => ({
                productId: product.id,
                variantId: variant.id,
                materialId: r.materialId,
                quantity: r.quantity,
                unit: r.unit,
                wastagePercent: r.wastagePercent ?? 0,
              })),
            });
          }
        }
      }

      // 3. Crea addon
      if (dto.addons?.length) {
        for (const a of dto.addons) {
          await tx.productAddon.create({
            data: {
              productId: product.id,
              name: a.name,
              maxQuantity: a.maxQuantity ?? 0,
              sortOrder: a.sortOrder ?? 0,
              items: {
                create:
                  a.items?.map((item) => ({
                    addonProductId: item.addonProductId,
                    quantityValue: item.quantityValue ?? 1,
                    price: item.price,
                    sortOrder: item.sortOrder ?? 0,
                  })) || [],
              },
            },
          });
        }
      }

      // 4. Assegna modifier groups
      if (dto.modifierGroupIds?.length) {
        await tx.productModifier.createMany({
          data: dto.modifierGroupIds.map((gid) => ({
            productId: product.id,
            groupId: gid,
            isRequired: false,
          })),
        });
      }

      // 5. Ritorna prodotto completo
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: true,
          recipes: { include: { material: { include: { units: true } } } },
          modifiers: { include: { group: { include: { options: true } } } },
          addons: {
            include: {
              items: { include: { addonProduct: true } },
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
        recipes: { include: { material: { include: { units: true } } } },
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
        recipes: { include: { material: { include: { units: true } } } },
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
    return this.prisma.$transaction(async (tx) => {
      // 1. Aggiorna prodotto base
      await tx.product.update({
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
      });

      // 2. Upsert varianti con ricette
      if (dto.variants !== undefined) {
        const existing = await tx.productVariant.findMany({
          where: { productId: id },
        });
        const existingIds = new Set(existing.map((v) => v.id));
        const dtoIds = new Set(
          dto.variants.filter((v) => v.id).map((v) => v.id!),
        );

        // Soft delete varianti rimosse
        for (const ev of existing) {
          if (!dtoIds.has(ev.id)) {
            await tx.productVariant.update({
              where: { id: ev.id },
              data: { isActive: false },
            });
          }
        }

        // Upsert varianti
        for (const v of dto.variants) {
          let variantId: number;
          if (v.id && existingIds.has(v.id)) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                priceAdjustment: v.priceAdjustment ?? 0,
              },
            });
            variantId = v.id;
          } else {
            const newVariant = await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                sku: v.sku,
                priceAdjustment: v.priceAdjustment ?? 0,
              },
            });
            variantId = newVariant.id;
          }

          // Sostituisci ricette per questa variante
          await tx.productRecipe.deleteMany({
            where: { productId: id, variantId },
          });
          if (v.recipes?.length) {
            await tx.productRecipe.createMany({
              data: v.recipes.map((r) => ({
                productId: id,
                variantId,
                materialId: r.materialId,
                quantity: r.quantity,
                unit: r.unit,
                wastagePercent: r.wastagePercent ?? 0,
              })),
            });
          }
        }

        // Cancella ricette del prodotto base (variantId = null) — non più usate con approccio B
        await tx.productRecipe.deleteMany({
          where: { productId: id, variantId: null },
        });
      }

      // 3. Sostituisci addon
      if (dto.addons !== undefined) {
        await tx.productAddon.deleteMany({ where: { productId: id } });
        for (const a of dto.addons) {
          await tx.productAddon.create({
            data: {
              productId: id,
              name: a.name,
              maxQuantity: a.maxQuantity ?? 0,
              sortOrder: a.sortOrder ?? 0,
              items: {
                create:
                  a.items?.map((item) => ({
                    addonProductId: item.addonProductId,
                    quantityValue: item.quantityValue ?? 1,
                    price: item.price,
                    sortOrder: item.sortOrder ?? 0,
                  })) || [],
              },
            },
          });
        }
      }

      // 4. Sostituisci modifier groups
      if (dto.modifierGroupIds !== undefined) {
        await tx.productModifier.deleteMany({ where: { productId: id } });
        if (dto.modifierGroupIds.length > 0) {
          await tx.productModifier.createMany({
            data: dto.modifierGroupIds.map((gid) => ({
              productId: id,
              groupId: gid,
              isRequired: false,
            })),
          });
        }
      }

      // 5. Ritorna prodotto completo
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
          recipes: { include: { material: { include: { units: true } } } },
          modifiers: { include: { group: { include: { options: true } } } },
          addons: {
            include: {
              items: { include: { addonProduct: true } },
            },
          },
        },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // POS Sync Endpoint
  async getProductsForPOS(companyId: number) {
    return this.prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        recipes: { include: { material: { include: { units: true } } } },
        modifiers: {
          include: {
            group: {
              include: {
                options: {
                  where: { isActive: true },
                  include: { material: true }, // ← AGGIUNGI QUESTA RIGA
                },
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
