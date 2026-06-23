import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding modifiers...');

  // 1. Trova un prodotto esistente
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log('No products found! Create a product first.');
    return;
  }
  console.log('Using product:', product.id, product.name);

  // 2. Crea ModifierGroup
  const group = await prisma.modifierGroup.upsert({
    where: { id: 1 },
    update: {},
    create: {
      storeId: 1,
      name: 'Toppings',
      selectionType: 'MULTI',
      minSelect: 0,
      maxSelect: 3,
      isActive: true,
    },
  });
  console.log('ModifierGroup created:', group.id);

  // 3. Crea Options
  const optionsData = [
    { id: 1, name: 'Extra Cheese', priceAdjustment: 20, groupId: group.id },
    { id: 2, name: 'Bacon', priceAdjustment: 30, groupId: group.id },
    { id: 3, name: 'Mushrooms', priceAdjustment: 15, groupId: group.id },
  ];

  for (const opt of optionsData) {
    await prisma.modifierOption.upsert({
      where: { id: opt.id },
      update: {},
      create: {
        name: opt.name,
        priceAdjustment: opt.priceAdjustment,
        groupId: opt.groupId,
      },
    });
  }
  console.log('ModifierOptions created');

  // 4. Collega al prodotto trovato
  const existing = await prisma.productModifier.findFirst({
    where: { productId: product.id, groupId: group.id },
  });

  if (!existing) {
    await prisma.productModifier.create({
      data: {
        productId: product.id,
        groupId: group.id,
        isRequired: false,
        sortOrder: 0,
      },
    });
    console.log('ProductModifier linked to product', product.id);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
