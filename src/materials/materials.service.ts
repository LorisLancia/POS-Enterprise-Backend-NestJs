import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateMaterialDto) {
    return this.prisma.material.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        minStock: dto.minStock ? parseFloat(dto.minStock) : null,
        isActive: dto.isActive ?? true,
        units: {
          create: dto.units.map((u) => ({
            unit: u.unit,
            quantity: parseFloat(u.quantity),
            isDefault: u.isDefault ?? false,
            isPurchaseUnit: u.isPurchaseUnit ?? false,
            isSaleUnit: u.isSaleUnit ?? false,
          })),
        },
      },
      include: { units: true },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.material.findMany({
      where: { companyId },
      include: { units: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { units: true },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async update(id: number, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);

    // Se vengono passate le unità, le aggiorniamo
    let unitsUpdate = {};
    if (dto.units) {
      // Elimina le unità esistenti e ricrea
      unitsUpdate = {
        units: {
          deleteMany: {},
          create: dto.units.map((u) => ({
            unit: u.unit,
            quantity: parseFloat(u.quantity),
            isDefault: u.isDefault ?? false,
            isPurchaseUnit: u.isPurchaseUnit ?? false,
            isSaleUnit: u.isSaleUnit ?? false,
          })),
        },
      };
    }

    return this.prisma.material.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        minStock: dto.minStock !== undefined ? parseFloat(dto.minStock) : null,
        isActive: dto.isActive,
        ...unitsUpdate,
      },
      include: { units: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.material.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
