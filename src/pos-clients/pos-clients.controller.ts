import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PosClientsService } from './pos-clients.service';
import { CreatePosClientDto, UpdatePosClientDto } from './dto/pos-client.dto';
import { SetupPosClientDto } from './dto/setup-pos-client.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pos-clients')
export class PosClientsController {
  constructor(private readonly service: PosClientsService) {}

  // ===================== SETUP WIZARD (public) =====================
  @Post('setup')
  @Public()
  setup(@Body() dto: SetupPosClientDto) {
    return this.service.setup(dto);
  }

  // ===================== EXISTING ENDPOINTS =====================
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePosClientDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosClientDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.reactivate(id);
  }

  @Post(':id/self-deactivate')
  @UseGuards(JwtAuthGuard)
  selfDeactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/sync')
  @UseGuards(JwtAuthGuard)
  registerSync(@Param('id', ParseIntPipe) id: number) {
    return this.service.registerSync(id);
  }

  @Post('register')
  @Public()
  registerFromPOS(@Body() dto: CreatePosClientDto) {
    return this.service.create(dto);
  }

  @Post('machine-token')
  @Public()
  getMachineToken(@Body() dto: { hardwareId: string; posClientId: number }) {
    return this.service.generateMachineToken(dto.hardwareId, dto.posClientId);
  }
}
