import { PrismaClient, StandardUnit } from '@prisma/client';

const prisma = new PrismaClient();

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
  const category = await prisma.productCategory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyId: company.id,
      name: 'Beverages',
      sortOrder: 1,
    },
  });

  // 6. Material: Grey Goose (esempio con multi-unità)
  const greyGoose = await prisma.material.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyId: company.id,
      name: 'Grey Goose Vodka',
      description: 'Premium French vodka',
      category: 'Spirits',
      minStock: 2,
      isActive: true,
    },
  });

  // 7. MaterialUnits per Grey Goose
  await prisma.materialUnit.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      materialId: greyGoose.id,
      unit: StandardUnit.PC,
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      materialId: greyGoose.id,
      unit: StandardUnit.ML,
      quantity: 750,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      materialId: greyGoose.id,
      unit: StandardUnit.PK,
      quantity: 6,
      isDefault: false,
      isPurchaseUnit: true,
      isSaleUnit: false,
    },
  });

  // 8. Material: Beef (esempio peso)
  const beef = await prisma.material.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      companyId: company.id,
      name: 'Beef Tenderloin',
      description: 'Premium cut beef',
      category: 'Meat',
      minStock: 5,
      isActive: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      materialId: beef.id,
      unit: StandardUnit.KG,
      quantity: 1,
      isDefault: true,
      isPurchaseUnit: true,
      isSaleUnit: true,
    },
  });

  await prisma.materialUnit.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      materialId: beef.id,
      unit: StandardUnit.G,
      quantity: 1000,
      isDefault: false,
      isPurchaseUnit: false,
      isSaleUnit: true,
    },
  });

  // 9. Product: Vodka Tonic (esempio)
  const product = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
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

  // 10. Recipe per Vodka Tonic (50ml Grey Goose)
  await prisma.productRecipe.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      productId: product.id,
      materialId: greyGoose.id,
      quantity: 50,
      unit: StandardUnit.ML,
      wastagePercent: 2,
    },
  });

  console.log('✅ Seed completed successfully');
  console.log('   Company:', company.name);
  console.log('   Warehouse:', warehouse.name);
  console.log('   User:', user.username);
  console.log('   Materials: Grey Goose (PC/ML/PK), Beef (KG/G)');
  console.log('   Product: Vodka Tonic (50ml Grey Goose recipe)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
