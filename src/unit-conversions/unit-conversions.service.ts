import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';

@Injectable()
export class UnitConversionsService {
  constructor(private prisma: PrismaService) {}

  create(storeId: number, dto: CreateUnitConversionDto) {
    return this.prisma.unitConversion.create({
      data: {
        storeId,
        fromUnitId: dto.fromUnitId,
        toUnitId: dto.toUnitId,
        factor: dto.factor,
      },
      include: { fromUnit: true, toUnit: true },
    });
  }

  findAllByStore(storeId: number) {
    return this.prisma.unitConversion.findMany({
      where: { storeId, isActive: true },
      include: { fromUnit: true, toUnit: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.unitConversion.findUnique({
      where: { id },
      include: { fromUnit: true, toUnit: true },
    });
  }

  async update(id: number, dto: UpdateUnitConversionDto) {
    const exists = await this.prisma.unitConversion.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Conversion not found');
    return this.prisma.unitConversion.update({
      where: { id },
      data: dto,
      include: { fromUnit: true, toUnit: true },
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.unitConversion.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Conversion not found');
    return this.prisma.unitConversion.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
