import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role || !role.isActive) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Role name already exists');

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions as any,
      },
    });
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role || !role.isActive) throw new NotFoundException('Role not found');

    if (dto.name) {
      const existing = await this.prisma.role.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) throw new ConflictException('Role name already exists');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.permissions && { permissions: dto.permissions as any }),
      },
    });
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role || !role.isActive) throw new NotFoundException('Role not found');

    const userCount = await this.prisma.user.count({
      where: { roleId: id, isActive: true },
    });
    if (userCount > 0) {
      throw new ConflictException(
        'Cannot delete role with active users. Reassign users first.',
      );
    }

    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  getPermissions() {
    return [
      { category: 'Dashboard', permissions: ['dashboard:read'] },
      { category: 'Company', permissions: ['company:read', 'company:update'] },
      {
        category: 'Product',
        permissions: [
          'product:read',
          'product:create',
          'product:update',
          'product:delete',
        ],
      },
      {
        category: 'Inventory',
        permissions: [
          'inventory:read',
          'inventory:create',
          'inventory:update',
          'inventory:delete',
        ],
      },
      {
        category: 'Sale',
        permissions: [
          'sale:read',
          'sale:create',
          'sale:discount',
          'sale:refund',
        ],
      },
      {
        category: 'User',
        permissions: ['user:read', 'user:create', 'user:update', 'user:delete'],
      },
      {
        category: 'Role',
        permissions: ['role:read', 'role:create', 'role:update', 'role:delete'],
      },
      { category: 'Report', permissions: ['report:read'] },
      {
        category: 'POS Client',
        permissions: ['pos-client:read', 'pos-client:update'],
      },
      {
        category: 'Warehouse',
        permissions: [
          'warehouse:read',
          'warehouse:create',
          'warehouse:update',
          'warehouse:delete',
        ],
      },
      {
        category: 'Modifier Groups',
        permissions: [
          'modifier-group:read',
          'modifier-group:create',
          'modifier-group:update',
          'modifier-group:delete',
        ],
      },
    ];
  }
}
