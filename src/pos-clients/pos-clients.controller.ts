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
} from '@nestjs/common';
import { PosClientsService } from './pos-clients.service';
import { CreatePosClientDto, UpdatePosClientDto } from './dto/pos-client.dto';
import { Public } from '../auth/decorators/public.decorator'; // <-- Assicurati sia così

@Controller('pos-clients')
export class PosClientsController {
  constructor(private readonly service: PosClientsService) {}

  @Post()
  create(@Body() dto: CreatePosClientDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosClientDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/sync')
  registerSync(@Param('id', ParseIntPipe) id: number) {
    return this.service.registerSync(id);
  }

  @Post('register')
  @Public() // <-- Decoratore corretto
  registerFromPOS(@Body() dto: CreatePosClientDto) {
    return this.service.create(dto);
  }

  @Post('machine-token')
  @Public() // <-- Decoratore corretto
  getMachineToken(@Body() dto: { hardwareId: string; posClientId: number }) {
    return this.service.generateMachineToken(dto.hardwareId, dto.posClientId);
  }
}
