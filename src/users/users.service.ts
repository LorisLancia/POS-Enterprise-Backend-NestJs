import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    username: true,
    fullName: true,
    isActive: true,
    storeId: true,
    createdAt: true,
    updatedAt: true,
    role: {
      select: {
        id: true,
        name: true,
        description: true,
      },
    },
  };

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getRoleIdByName(roleName: string): Promise<number> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);
    return role.id;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        storeId_username: { storeId: dto.storeId || 1, username: dto.username },
      },
    });
    if (existing)
      throw new ConflictException('Username already exists in this store');

    const roleId = await this.getRoleIdByName(dto.role);
    const pinHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        pinHash,
        fullName: dto.fullName,
        roleId,
        storeId: dto.storeId || 1,
        isActive: dto.isActive ?? true,
      },
      select: this.userSelect,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = {
      fullName: dto.fullName,
      isActive: dto.isActive,
      storeId: dto.storeId,
    };

    if (dto.role) {
      data.roleId = await this.getRoleIdByName(dto.role);
    }

    if (dto.password) {
      data.pinHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
