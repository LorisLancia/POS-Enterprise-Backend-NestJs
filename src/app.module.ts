import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';
import { ProductAddonModule } from './product-addon/product-addon.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { CompaniesModule } from './companies/companies.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { PosClientsModule } from './pos-clients/pos-clients.module';

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
    CompaniesModule,
    WarehousesModule,
    PosClientsModule,
  ],
})
export class AppModule {}
