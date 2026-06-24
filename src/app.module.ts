import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';
import { ProductAddonModule } from './product-addon/product-addon.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';

// ... dentro @Module({ imports: [ ... ] })
// Aggiungi ProductCategoriesModule alla lista

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductCategoriesModule,
    ProductsModule,
    MaterialsModule,
    SalesModule,
    UsersModule,
    ProductAddonModule,
  ],
})
export class AppModule {}
