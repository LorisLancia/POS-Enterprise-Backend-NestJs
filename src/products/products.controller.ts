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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:create')
  create(@Body() dto: CreateProductDto, @Request() req: RequestWithUser) {
    return this.productsService.createProduct(req.user.companyId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findAll(@Request() req: RequestWithUser) {
    return this.productsService.findAllByStore(req.user.companyId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Get('pos/:companyId')
  @Public()
  getForPOS(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.productsService.getProductsForPOS(companyId);
  }
}
