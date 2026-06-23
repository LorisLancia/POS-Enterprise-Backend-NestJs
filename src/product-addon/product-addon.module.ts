import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductAddonService } from './product-addon.service';
import { ProductAddonController } from './product-addon.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProductAddonService],
  controllers: [ProductAddonController],
  exports: [ProductAddonService],
})
export class ProductAddonModule {}
