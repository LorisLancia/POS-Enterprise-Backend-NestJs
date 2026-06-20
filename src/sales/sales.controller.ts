import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
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

  // Shifts - route specifiche PRIMA di :id
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
    return this.salesService.listShifts(req.user.storeId);
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

  // Sales
  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:create')
  createSale(@Body() dto: CreateSaleDto, @Request() req: RequestWithUser) {
    return this.salesService.createSale(req.user.storeId, req.user.userId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  findAll(@Request() req: RequestWithUser) {
    return this.salesService.findAllByStore(req.user.storeId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('sale:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  // Public endpoint for POS sync
  @Post('sync')
  @Public()
  syncOfflineSale(@Body() dto: CreateSaleDto, @Request() req: RequestWithUser) {
    return this.salesService.syncOfflineSale(
      req.user.storeId,
      req.user.userId,
      dto,
    );
  }
}
