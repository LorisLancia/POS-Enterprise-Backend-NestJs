import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStartingBalanceDto } from './dto/create-starting-balance.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';

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
  @Get('starting-balance')
  findAllStartingBalance(
    @Query('warehouseId', ParseIntPipe) warehouseId: number,
  ) {
    return this.inventoryService.findAllStartingBalance(warehouseId);
  }

  @Get('transactions/:id')
  findOneTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneTransaction(id);
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryTransactionDto,
  ) {
    return this.inventoryService.updateTransaction(id, dto);
  }

  @Delete('transactions/:id')
  removeTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.removeTransaction(id);
  }
}
