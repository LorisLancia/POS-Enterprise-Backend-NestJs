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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePODto } from './dto/create-po.dto';
import { ReceivePODto } from './dto/receive-po.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-tx.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  // Materials
  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:create')
  createMaterial(
    @Body() dto: CreateMaterialDto,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.createMaterial(req.user.storeId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findAllMaterials(@Request() req: RequestWithUser) {
    return this.materialsService.findAllMaterials(req.user.storeId);
  }

  // Suppliers
  @Post('suppliers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:create')
  createSupplier(
    @Body() dto: CreateSupplierDto,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.createSupplier(req.user.storeId, dto);
  }

  @Get('suppliers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findAllSuppliers(@Request() req: RequestWithUser) {
    return this.materialsService.findAllSuppliers(req.user.storeId);
  }

  // Inventory
  @Get('inventory/:warehouseId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  getInventory(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return this.materialsService.getInventoryByWarehouse(warehouseId);
  }

  @Get('pos/inventory/:warehouseId')
  @Public()
  getInventoryForPOS(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return this.materialsService.getInventoryForPOS(warehouseId);
  }

  @Post('inventory/transaction')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:update')
  createTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.createInventoryTransaction(
      req.user.userId,
      dto,
    );
  }

  // Purchase Orders
  @Post('purchase-orders')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:create')
  createPO(@Body() dto: CreatePODto, @Request() req: RequestWithUser) {
    return this.materialsService.createPurchaseOrder(
      req.user.storeId,
      req.user.userId,
      dto,
    );
  }

  @Get('purchase-orders')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findAllPOs(@Request() req: RequestWithUser) {
    return this.materialsService.findAllPurchaseOrders(req.user.storeId);
  }

  @Post('purchase-orders/:id/receive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:update')
  receivePO(
    @Param('id', ParseIntPipe) poId: number,
    @Body() dto: ReceivePODto,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.receivePurchaseOrder(
      poId,
      req.user.userId,
      dto,
    );
  }

  // Transfers
  @Post('transfers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:update')
  createTransfer(
    @Body() dto: CreateTransferDto,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.createTransfer(
      req.user.storeId,
      req.user.userId,
      dto,
    );
  }

  @Get('transfers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findAllTransfers(@Request() req: RequestWithUser) {
    return this.materialsService.findAllTransfers(req.user.storeId);
  }

  @Post('transfers/:id/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:update')
  completeTransfer(
    @Param('id', ParseIntPipe) transferId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.materialsService.completeTransfer(transferId, req.user.userId);
  }
}
