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
    companyId: true,
    createdAt: true,
    updatedAt: true,
    role: {
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
      },
    },
  };

  async findAll(companyId?: number) {
    return this.prisma.user.findMany({
      where: companyId ? { companyId } : undefined,
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user || !user.isActive) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        companyId: dto.companyId,
        username: dto.username,
      },
    });
    if (existing)
      throw new ConflictException('Username already exists in this company');

    const pinHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        pinHash,
        fullName: dto.fullName,
        roleId: dto.roleId,
        companyId: dto.companyId,
        isActive: dto.isActive ?? true,
      },
      select: this.userSelect,
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.companyId !== undefined) data.companyId = dto.companyId;
    if (dto.roleId !== undefined) data.roleId = dto.roleId;

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
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
