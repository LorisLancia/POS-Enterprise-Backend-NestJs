import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { MaterialsModule } from './materials/materials.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { CompaniesModule } from './companies/companies.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { PosClientsModule } from './pos-clients/pos-clients.module';
import { ModifierGroupsModule } from './modifier-groups/modifier-groups.module';
import { RolesModule } from './roles/roles.module';
import { AddonGroupsModule } from './addon-groups/addon-groups.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { InventoryModule } from './Inventory/inventory.module';
import { PurchaseOrdersModule } from './purchase-order/purchase-orders.module';

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
    CompaniesModule,
    WarehousesModule,
    PosClientsModule,
    ModifierGroupsModule,
    RolesModule,
    AddonGroupsModule,
    PurchaseOrdersModule,
    SuppliersModule,
    InventoryModule,
  ],
})
export class AppModule {}
