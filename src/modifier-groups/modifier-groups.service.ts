import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';

@Injectable()
export class ModifierGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateModifierGroupDto) {
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
              unit: o.unit,
            })) || [],
        },
      },
      include: { options: true },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.modifierGroup.findMany({
      where: { companyId },
      include: { options: { include: { material: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id },
      include: { options: { include: { material: true } } },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return group;
  }

  async remove(id: number) {
    return this.prisma.modifierGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
