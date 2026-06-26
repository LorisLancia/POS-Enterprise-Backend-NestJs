import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePosClientDto, UpdatePosClientDto } from './dto/pos-client.dto';
import { SetupPosClientDto } from './dto/setup-pos-client.dto';

@Injectable()
export class PosClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ===================== SETUP WIZARD (single endpoint) =====================
  async setup(dto: SetupPosClientDto) {
    // 1. Verify admin credentials
    const users = await this.prisma.user.findMany({
      where: {
        username: dto.adminUsername,
        isActive: true,
      },
      include: { role: true },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let adminUser = null;
    for (const u of users) {
      const pinValid = await bcrypt.compare(dto.adminPin, u.pinHash);
      if (!pinValid) continue;

      const isAdmin =
        u.role.name === 'admin' ||
        (u.role.permissions as string[])?.includes('*');

      if (isAdmin) {
        adminUser = u;
        break;
      }
    }

    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify company access permissions
    const isSuperAdmin = (adminUser.role.permissions as string[])?.includes(
      '*',
    );

    if (!isSuperAdmin && adminUser.companyId !== dto.companyId) {
      throw new UnauthorizedException('Admin cannot configure this company');
    }

    // 3. Verify company and warehouse exist
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, companyId: dto.companyId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    // 4. Check if POS client already exists with this hardwareId
    const existing = await this.prisma.pOSClient.findFirst({
      where: { hardwareId: dto.hardwareId, companyId: dto.companyId },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          'POS Client already active. Please deactivate it first (via Reconfigure from the POS, or from the admin panel).',
        );
      }

      // Riattiva il POS disattivato
      const updated = await this.prisma.pOSClient.update({
        where: { id: existing.id },
        data: {
          name: dto.registerName,
          location: dto.location,
          warehouse: { connect: { id: dto.warehouseId } },
          isActive: true,
          // ❌ RIMOSSO: updatedAt: new Date(),  <-- Prisma non lo ha nel modello
        },
        include: { company: true, warehouse: true }, // ✅ AGGIUNTO
      });

      const payload = {
        sub: updated.id,
        type: 'machine',
        hardwareId: dto.hardwareId,
      };
      const machineToken = this.jwtService.sign(payload, {
        expiresIn: '3650d',
      });

      return {
        posClientId: updated.id,
        machineToken,
        companyId: updated.companyId,
        companyName: updated.company.name,
        warehouseId: updated.warehouseId,
        warehouseName: updated.warehouse.name,
        registerName: updated.name,
        hardwareId: updated.hardwareId,
      };
    }

    // 5. Create new POS client
    const posClient = await this.prisma.pOSClient.create({
      data: {
        name: dto.registerName,
        location: dto.location,
        hardwareId: dto.hardwareId,
        company: { connect: { id: dto.companyId } },
        warehouse: { connect: { id: dto.warehouseId } },
      },
      include: { company: true, warehouse: true },
    });

    // 6. Generate machine token (10 years)
    const payload = {
      sub: posClient.id,
      type: 'machine',
      hardwareId: dto.hardwareId,
    };
    const machineToken = this.jwtService.sign(payload, { expiresIn: '3650d' });

    return {
      posClientId: posClient.id,
      machineToken,
      companyId: posClient.companyId,
      companyName: posClient.company.name,
      warehouseId: posClient.warehouseId,
      warehouseName: posClient.warehouse.name,
      registerName: posClient.name,
      hardwareId: posClient.hardwareId,
    };
  }

  // ===================== EXISTING METHODS =====================
  async create(dto: CreatePosClientDto) {
    const hardwareId = dto.hardwareId || `TEMP-${Date.now()}`;

    const existing = await this.prisma.pOSClient.findFirst({
      where: { hardwareId },
    });
    if (existing)
      throw new ConflictException(
        'POS Client with this hardwareId already exists',
      );

    return this.prisma.pOSClient.create({
      data: {
        name: dto.name,
        location: dto.location,
        hardwareId,
        company: { connect: { id: dto.companyId } },
        warehouse: { connect: { id: dto.warehouseId } },
      },
      include: { company: true, warehouse: true },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.pOSClient.findMany({
      where: { companyId },
      include: { company: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.pOSClient.findUnique({
      where: { id },
      include: {
        company: true,
        warehouse: true,
        shifts: { orderBy: { openedAt: 'desc' }, take: 5 },
      },
    });
    if (!client) throw new NotFoundException('POS Client not found');
    return client;
  }

  async update(id: number, dto: UpdatePosClientDto) {
    await this.findOne(id);

    const updateData: any = {
      name: dto.name,
      location: dto.location,
      hardwareId: dto.hardwareId,
      isActive: dto.isActive,
    };

    if (dto.warehouseId) {
      updateData.warehouse = { connect: { id: dto.warehouseId } };
    }

    return this.prisma.pOSClient.update({
      where: { id },
      data: updateData,
      include: { company: true, warehouse: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pOSClient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivate(id: number) {
    await this.findOne(id);
    return this.prisma.pOSClient.update({
      where: { id },
      data: { isActive: true },
      include: { company: true, warehouse: true },
    });
  }

  async registerSync(id: number) {
    await this.findOne(id);
    return this.prisma.pOSClient.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  async generateMachineToken(hardwareId: string, posClientId: number) {
    const client = await this.prisma.pOSClient.findFirst({
      where: { id: posClientId, hardwareId, isActive: true },
    });

    if (!client) {
      throw new UnauthorizedException('POS Client not found or inactive');
    }

    const payload = {
      sub: posClientId,
      type: 'machine',
      hardwareId,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '3650d' }),
    };
  }
}
