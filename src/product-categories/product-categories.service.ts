import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: number, dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        companyId,
        name: dto.name,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async findAllByStore(companyId: number) {
    const all = await this.prisma.productCategory.findMany({
      where: { companyId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { children: true },
    });

    // Ritorna solo le root (parentId = null), con children annidati
    return this.buildTree(all);
  }

  private buildTree(categories: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    // Prima passata: popola la mappa
    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    // Seconda passata: collega parent-child
    for (const cat of categories) {
      const node = map.get(cat.id);
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  findOne(id: number) {
    return this.prisma.productCategory.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }

  async update(id: number, dto: UpdateProductCategoryDto) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Category not found');

    // Evita cicli: non puoi essere tuo proprio discendente
    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const isDescendant = await this.isDescendant(id, dto.parentId);
      if (isDescendant) {
        throw new BadRequestException('Cannot assign a descendant as parent');
      }
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });
  }

  private async isDescendant(
    ancestorId: number,
    potentialDescendantId: number,
  ): Promise<boolean> {
    let current = potentialDescendantId;
    const visited = new Set<number>();

    while (current) {
      if (visited.has(current)) return false; // Ciclo rilevato
      visited.add(current);

      const cat = await this.prisma.productCategory.findUnique({
        where: { id: current },
        select: { parentId: true },
      });

      if (!cat || !cat.parentId) return false;
      if (cat.parentId === ancestorId) return true;
      current = cat.parentId;
    }

    return false;
  }

  async remove(id: number) {
    const exists = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Category not found');

    // Soft-delete ricorsivo: disattiva anche tutti i figli
    await this.softDeleteRecursive(id);

    return { message: 'Category and its children deleted' };
  }

  private async softDeleteRecursive(parentId: number) {
    const children = await this.prisma.productCategory.findMany({
      where: { parentId, isActive: true },
    });

    for (const child of children) {
      await this.softDeleteRecursive(child.id);
    }

    await this.prisma.productCategory.update({
      where: { id: parentId },
      data: { isActive: false },
    });
  }
}
