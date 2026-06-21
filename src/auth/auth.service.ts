import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        username: dto.username,
        storeId: dto.storeId,
        isActive: true,
      },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const pinValid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!pinValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Crea sessione
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token: 'pending', // aggiornato dopo
        isValid: true,
      },
    });

    const payload = {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      storeId: user.storeId,
      permissions: user.role.permissions as string[],
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role.name,
        permissions: user.role.permissions,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, store: true },
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role.name,
      permissions: user.role.permissions,
      store: user.store.name,
    };
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
      access_token: this.jwtService.sign(payload, { expiresIn: '3650d' }), // 10 anni
    };
  }
}
