import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  create(companyId: number, dto: CreateUnitDto) {
    return this.prisma.unit.create({
      data: {
        companyId,
        name: dto.name,
        symbol: dto.symbol,
        type: dto.type || 'piece',
      },
    });
  }

  findAllByStore(companyId: number) {
    return this.prisma.unit.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.unit.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateUnitDto) {
    const exists = await this.prisma.unit.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Unit not found');
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const exists = await this.prisma.unit.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Unit not found');
    return this.prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
