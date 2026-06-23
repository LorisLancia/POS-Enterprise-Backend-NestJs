import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    MaterialsModule,
    SalesModule,
    UsersModule,
  ],
})
export class AppModule {}
