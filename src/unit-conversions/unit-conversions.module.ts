import { Module } from '@nestjs/common';
import { UnitConversionsService } from './unit-conversions.service';
import { UnitConversionsController } from './unit-conversions.controller';

@Module({
  controllers: [UnitConversionsController],
  providers: [UnitConversionsService],
  exports: [UnitConversionsService],
})
export class UnitConversionsModule {}
