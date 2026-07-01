import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStartingBalanceDto } from './dto/create-starting-balance.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('starting-balance')
  createStartingBalance(@Body() dto: CreateStartingBalanceDto) {
    return this.inventoryService.createStartingBalance(dto);
  }

  @Get('warehouse/:warehouseId')
  getByWarehouse(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return this.inventoryService.getInventoryByWarehouse(warehouseId);
  }

  @Get('company/:companyId')
  getByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.inventoryService.getInventoryByCompany(companyId);
  }

  @Get('transactions/:warehouseId')
  getTransactions(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return this.inventoryService.getInventoryTransactions(warehouseId);
  }
}
