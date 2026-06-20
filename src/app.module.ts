import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    MaterialsModule,
    SalesModule,
  ],
})
export class AppModule {}
