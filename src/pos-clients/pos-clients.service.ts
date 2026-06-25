import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePosClientDto, UpdatePosClientDto } from './dto/pos-client.dto';

@Injectable()
export class PosClientsService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { companyId, isActive: true },
      include: { company: true, warehouse: true },
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

    // Questo metodo richiede JwtService — va importato
    // Per ora restituiamo un oggetto semplice, il controller auth gestisce il JWT
    return { message: 'Machine token generated', posClientId, hardwareId };
  }
}
