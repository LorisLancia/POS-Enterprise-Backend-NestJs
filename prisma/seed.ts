import { PrismaClient, StandardUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSequences() {
  const tables = [
    'companies',
    'warehouses',
    'roles',
    'users',
    'user_sessions',
    'materials',
    'material_units',
    'products',
    'product_categories',
    'product_variants',
    'product_recipes',
    'modifier_groups',
    'modifier_options',
    'product_modifiers',
    'product_addons',
    'product_addon_items',
    'sale_item_addons',
    'inventory',
    'inventory_transactions',
    'suppliers',
    'purchase_orders',
    'po_items',
    'pos_clients',
    'shifts',
    'cash_movements',
    'sales',
    'sale_items',
    'sale_item_modifiers',
    'payments',
    'sync_metadata',
    'warehouse_transfers',
  ];

  for (const table of tables) {
    const seqName = `${table}_id_seq`;
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval('"${seqName}"', COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false);`,
      );
    } catch (e) {
      // Sequenza non esiste, ignora
    }
  }
}

async function main() {
  // 1. Company
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Default Company',
      timezone: 'Asia/Bangkok',
      currency: 'THB',
    },
  });

  // 2. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyId: company.id,
      name: 'Main Warehouse',
    },
  });

  // 3. Role
  const role = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'admin',
      permissions: ['*'],
      description: 'Full access',
    },
  });

  // 4. User
  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyId: company.id,
      roleId: role.id,
      username: 'admin',
      pinHash: '$2b$10$QvYEE3BlJzQCKipbCuQfsOFAHZC2kZElffilaycb4397grMKsbmPy',
      fullName: 'Administrator',
      isActive: true,
    },
  });

  // 5. Product Category
  let category = await prisma.productCategory.findFirst({
    where: { companyId: company.id, name: 'Beverages' },
  });
  if (!category) {
    category = await prisma.productCategory.create({
      data: {
        companyId: company.id,
        name: 'Beverages',
        sortOrder: 1,
      },
    });
  }

  // 6. Material: Grey Goose (NO id esplicito)
  let greyGoose = await prisma.material.findFirst({
    where: { companyId: company.id, name: 'Grey Goose Vodka' },
  });
  if (!greyGoose) {
    greyGoose = await prisma.material.create({
      data: {
        companyId: company.id,
        name: 'Grey Goose Vodka',
        description: 'Premium French vodka',
        category: 'Spirits',
        minStock: 2,
        isActive: true,
      },
    });
  }

  // 7. MaterialUnits per Grey Goose
  await prisma.materialUnit.upsert({
    where: {
      materialId_unit: { materialId: greyGoose.id, unit: StandardUnit.PC },
    },
    update: {
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
    create: {
      materialId: greyGoose.id,
      unit: StandardUnit.PC,
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: {
      materialId_unit: { materialId: greyGoose.id, unit: StandardUnit.ML },
    },
    update: {
      quantity: 750,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
    create: {
      materialId: greyGoose.id,
      unit: StandardUnit.ML,
      quantity: 750,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: {
      materialId_unit: { materialId: greyGoose.id, unit: StandardUnit.PK },
    },
    update: {
      quantity: 6,
      isDefault: false,
      isPurchaseUnit: true,
      isSaleUnit: false,
    },
    create: {
      materialId: greyGoose.id,
      unit: StandardUnit.PK,
      quantity: 6,
      isDefault: false,
      isPurchaseUnit: true,
      isSaleUnit: false,
    },
  });

  // 8. Material: Beef (NO id esplicito)
  let beef = await prisma.material.findFirst({
    where: { companyId: company.id, name: 'Beef Tenderloin' },
  });
  if (!beef) {
    beef = await prisma.material.create({
      data: {
        companyId: company.id,
        name: 'Beef Tenderloin',
        description: 'Premium cut beef',
        category: 'Meat',
        minStock: 5,
        isActive: true,
      },
    });
  }

  await prisma.materialUnit.upsert({
    where: { materialId_unit: { materialId: beef.id, unit: StandardUnit.KG } },
    update: {
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
    create: {
      materialId: beef.id,
      unit: StandardUnit.KG,
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: { materialId_unit: { materialId: beef.id, unit: StandardUnit.G } },
    update: {
      quantity: 1000,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
    create: {
      materialId: beef.id,
      unit: StandardUnit.G,
      quantity: 1000,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
  });

  // 9. Product: Vodka Tonic (NO id esplicito)
  let product = await prisma.product.findFirst({
    where: { companyId: company.id, sku: 'VT-001' },
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        name: 'Vodka Tonic',
        sku: 'VT-001',
        basePrice: 250,
        taxRate: 7,
        trackInventory: true,
        isActive: true,
      },
    });
  }

  // 10. Recipe per Vodka Tonic (findFirst + create/update, NO upsert per chiave composta)
  const existingRecipe = await prisma.productRecipe.findFirst({
    where: { productId: product.id, materialId: greyGoose.id },
  });
  if (existingRecipe) {
    await prisma.productRecipe.update({
      where: { id: existingRecipe.id },
      data: { quantity: 50, unit: StandardUnit.ML, wastagePercent: 2 },
    });
  } else {
    await prisma.productRecipe.create({
      data: {
        productId: product.id,
        materialId: greyGoose.id,
        quantity: 50,
        unit: StandardUnit.ML,
        wastagePercent: 2,
      },
    });
  }

  // Resetta sequenze autoincrement
  await resetSequences();

  console.log('✅ Seed completed successfully');
  console.log('  Company:', company.name);
  console.log('  Warehouse:', warehouse.name);
  console.log('  User:', user.username);
  console.log('  Materials: Grey Goose (PC/ML/PK), Beef (KG/G)');
  console.log('  Product: Vodka Tonic (50ml Grey Goose recipe)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
