import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';

@Injectable()
export class AddonGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateAddonGroupDto) {
    return this.prisma.addonGroup.create({
      data: {
        companyId,
        name: dto.name,
        maxQuantity: dto.maxQuantity ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        items: {
          create:
            dto.items?.map((item) => ({
              addonProductId: item.addonProductId,
              quantityValue: item.quantityValue ?? 1,
              price: item.price,
              sortOrder: item.sortOrder ?? 0,
            })) || [],
        },
      },
      include: {
        items: { include: { addonProduct: true } },
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.addonGroup.findMany({
      where: { companyId },
      include: {
        items: {
          where: { isActive: true },
          include: { addonProduct: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.addonGroup.findUnique({
      where: { id },
      include: {
        items: { include: { addonProduct: true } },
      },
    });
    if (!group) throw new NotFoundException('Addon group not found');
    return group;
  }

  async update(id: number, dto: UpdateAddonGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.addonGroup.update({
        where: { id },
        data: {
          name: dto.name,
          maxQuantity: dto.maxQuantity,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      if (dto.items) {
        await tx.addonGroupItem.deleteMany({ where: { groupId: id } });
        if (dto.items.length > 0) {
          await tx.addonGroupItem.createMany({
            data: dto.items.map((item) => ({
              groupId: id,
              addonProductId: item.addonProductId,
              quantityValue: item.quantityValue ?? 1,
              price: item.price,
              sortOrder: item.sortOrder ?? 0,
            })),
          });
        }
      }

      return tx.addonGroup.findUnique({
        where: { id },
        include: { items: { include: { addonProduct: true } } },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.addonGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
