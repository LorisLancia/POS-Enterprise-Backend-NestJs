// src/product-addon/product-addon.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductAddonService } from './product-addon.service';
import { CreateProductAddonDto } from './dto/create-product-addon.dto';
import { UpdateProductAddonDto } from './dto/update-product-addon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('product-addons')
@UseGuards(JwtAuthGuard)
export class ProductAddonController {
  constructor(private readonly service: ProductAddonService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:create')
  create(@Body() dto: CreateProductAddonDto, @Request() req: RequestWithUser) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get('product/:productId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.findAllByProduct(productId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductAddonDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
