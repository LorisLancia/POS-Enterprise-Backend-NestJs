import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProductAddonService } from './product-addon.service';
import { CreateProductAddonDto } from './dto/create-product-addon.dto';
import { UpdateProductAddonDto } from './dto/update-product-addon.dto';

@Controller('product-addons')
export class ProductAddonController {
  constructor(private readonly service: ProductAddonService) {}

  @Post()
  create(
    @Body() dto: CreateProductAddonDto,
    @Query('storeId') storeId: string,
  ) {
    // TODO: sostituire storeId con decorator @CurrentStore() o @CurrentUser()
    return this.service.create(Number(storeId), dto);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.service.findAllByProduct(Number(productId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductAddonDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
