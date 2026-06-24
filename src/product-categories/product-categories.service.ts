import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  create(storeId: number, dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        storeId,
        name: dto.name,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  findAllByStore(storeId: number) {
    return this.prisma.productCategory.findMany({
      where: { storeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.productCategory.findUnique({
      where: { id },
    });
  }

  async update(id: number, dto: UpdateProductCategoryDto) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Category not found');
    return this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Category not found');
    return this.prisma.productCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
