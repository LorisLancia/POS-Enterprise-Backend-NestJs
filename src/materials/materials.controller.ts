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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:create')
  create(@Body() dto: CreateMaterialDto, @Request() req: RequestWithUser) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findAll(@Request() req: RequestWithUser) {
    return this.service.findAll(req.user.companyId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('inventory:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
