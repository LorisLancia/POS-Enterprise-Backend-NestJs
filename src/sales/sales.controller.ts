import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:create')
  createSale(@Body() dto: CreateSaleDto, @Request() req: RequestWithUser) {
    const userId = dto.userId ?? req.user.userId;
    const companyId = req.user?.companyId ?? dto.companyId ?? 1;
    console.log('>>> Controller createSale:', {
      companyId,
      userId,
      reqUser: req.user,
    });
    return this.salesService.createSale(companyId, userId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  findAll(@Request() req: RequestWithUser) {
    return this.salesService.findAllByStore(req.user.companyId);
  }

  // === ROUTE STATICHE PRIMA di quelle dinamiche (:id) ===

  // Report - DEVE essere prima di @Get(':id')
  @Get('report')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  getReport(@Query('from') from: string, @Query('to') to: string) {
    return this.salesService.getReport(new Date(from), new Date(to));
  }

  // Shifts
  @Post('shifts/open')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:create')
  openShift(@Body() dto: OpenShiftDto, @Request() req: RequestWithUser) {
    return this.salesService.openShift(
      dto.posClientId,
      req.user.userId,
      dto.startingCash,
    );
  }

  @Get('shifts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  listShifts(@Request() req: RequestWithUser) {
    return this.salesService.listShifts(req.user.companyId);
  }

  @Post('shifts/:id/close')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:create')
  closeShift(
    @Param('id', ParseIntPipe) shiftId: number,
    @Body() dto: CloseShiftDto,
    @Request() req: RequestWithUser,
  ) {
    return this.salesService.closeShift(shiftId, req.user.userId, dto);
  }

  @Get('shifts/:id/report')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  getShiftReport(@Param('id', ParseIntPipe) shiftId: number) {
    return this.salesService.getShiftReport(shiftId);
  }

  // Public endpoint for POS sync
  @Post('sync')
  @Public()
  syncOfflineSale(@Body() dto: CreateSaleDto, @Request() req: RequestWithUser) {
    const userId = dto.userId ?? req.user?.userId ?? 1;
    const companyId = req.user?.companyId ?? dto.companyId ?? 1;
    return this.salesService.createSale(companyId, userId, dto);
  }

  // =======================================================

  // Route dinamica PER ULTIMA
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}
