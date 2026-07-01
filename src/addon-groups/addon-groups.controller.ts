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
  Req,
} from '@nestjs/common';
import { AddonGroupsService } from './addon-groups.service';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addon-groups')
@UseGuards(JwtAuthGuard)
export class AddonGroupsController {
  constructor(private readonly addonGroupsService: AddonGroupsService) {}

  @Post()
  create(@Body() dto: CreateAddonGroupDto, @Req() req: any) {
    return this.addonGroupsService.create(req.user.companyId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.addonGroupsService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.addonGroupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddonGroupDto,
  ) {
    return this.addonGroupsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.addonGroupsService.remove(id);
  }
}
