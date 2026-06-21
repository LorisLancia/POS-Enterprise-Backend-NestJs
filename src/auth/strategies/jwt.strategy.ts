import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        'pos-enterprise-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    console.log('>>> JwtStrategy payload:', JSON.stringify(payload));

    if (payload.type === 'machine') {
      console.log('>>> Machine token detected, storeId:', payload.storeId);
      return {
        userId: 0,
        username: 'machine',
        roleId: 0,
        storeId: payload.storeId || 1,
        permissions: ['*'],
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      storeId: user.storeId,
      permissions: user.role.permissions as string[],
    };
  }
}
