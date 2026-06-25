import { Module } from '@nestjs/common';
import { PosClientsService } from './pos-clients.service';
import { PosClientsController } from './pos-clients.controller';

@Module({
  providers: [PosClientsService],
  controllers: [PosClientsController],
  exports: [PosClientsService],
})
export class PosClientsModule {}
