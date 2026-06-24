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
import { UnitConversionsService } from './unit-conversions.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('unit-conversions')
@UseGuards(JwtAuthGuard)
export class UnitConversionsController {
  constructor(private service: UnitConversionsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:create')
  create(
    @Body() dto: CreateUnitConversionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.create(req.user.storeId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findAll(@Request() req: RequestWithUser) {
    return this.service.findAllByStore(req.user.storeId);
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
    @Body() dto: UpdateUnitConversionDto,
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
