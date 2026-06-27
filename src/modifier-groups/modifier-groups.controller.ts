import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ModifierGroupsService } from './modifier-groups.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('modifier-groups')
@UseGuards(JwtAuthGuard)
export class ModifierGroupsController {
  constructor(private service: ModifierGroupsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:create')
  create(@Body() dto: CreateModifierGroupDto, @Request() req: RequestWithUser) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findAll(@Request() req: RequestWithUser) {
    return this.service.findAll(req.user.companyId);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('product:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
