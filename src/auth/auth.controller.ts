import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SeedService } from './seed.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { Public } from './decorators/public.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private seedService: SeedService,
  ) {}

  @Post('setup')
  async setup() {
    return this.seedService.seed();
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: RequestWithUser) {
    return this.authService.getMe(req.user.userId);
  }

  @Get('health')
  @Public()
  health() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('user:create')
  adminOnly() {
    return { message: 'You have permission to create users' };
  }

  @Post('machine-token')
  @Public()
  async machineToken(@Body() dto: { hardwareId: string; posClientId: number }) {
    return this.authService.generateMachineToken(
      dto.hardwareId,
      dto.posClientId,
    );
  }

  // ===================== NUOVO: Admin Companies =====================
  @Post('admin-companies')
  @Public()
  async getAdminCompanies(@Body() dto: { username: string; pin: string }) {
    return this.authService.getAdminCompanies(dto.username, dto.pin);
  }
}
