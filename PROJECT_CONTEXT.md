POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuità tra sessioni di lavoro.
Aggiorna la sezione “Ultimo aggiornamento” ogni volta che modifichi qualcosa.

---

Ultimo aggiornamento
2026-06-24
Stack tecnologico
Layer Tecnologia Versione / Note
Backend sede NestJS v11, TypeScript
ORM Prisma v5.22.0, PostgreSQL
DB Sede PostgreSQL 16+ JSONB per varianti/modifier flessibili, replication ready
Frontend gestione Angular v21.2.16, Signals (@if/@for, signal(), computed())
POS Client C# WPF .NET MVVM, SQLite locale per offline
Comunicazione REST API + WebSocket REST per bulk sync; WebSocket per aggiornamenti real-time
Auth JWT + Passport PIN-based per utenti POS

---

Pattern frontend (Angular)
REGOLA FERMA: Tutta la reattività UI usa Angular Signals (signal(), computed()).
MAI usare proprietà plain o \*ngIf per stato che deve aggiornare la UI.
Usare sempre @if / @for (control flow) nei template.

---

Database - Stato entità
Entità Stato Note
Company ✅ Multi-sede base
Store ✅ Collega tutto al negozio
Warehouse ✅ Tipi: main, bar, shisha, kitchen
Role / User / UserSession ✅ RBAC con permissions JSON
Material ✅ Unità: piece, gram, milliliter, bottle, can
Product ✅ basePrice, taxRate, trackInventory, allowDecimalQty
ProductCategory ✅ Con colore e sortOrder
ProductVariant ✅ Esempio: Small, Large, priceAdjustment
ProductRecipe ✅ BOM per consumo materiali (variantId opzionale)
ModifierGroup ✅ selectionType: single/multiple, min/max select
ModifierOption ✅ priceAdjustment, materialId, quantityConsumed
ProductModifier ✅ Collega Product ↔ ModifierGroup (isRequired, sortOrder)
Inventory / InventoryTransaction ✅ Traccia giacenza e movimenti
Supplier / PurchaseOrder / POItem ✅ Ordini acquisto
POSClient ✅ Hardware ID, lastSyncAt
Shift / CashMovement ✅ Turni cassa
Sale / SaleItem / SaleItemModifier / Payment ✅ Vendite complete
SyncMetadata ✅ Per sync POS offline
ProductAddon ❌ MANCA Tabella ponte: Product → Addon (maxQuantity, sortOrder)
ProductAddonItem ❌ MANCA Lista prodotti-addon con quantityValue

---

Schema Prisma completo (attuale)
generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

// ==================== CORE / MULTI-SEDE ====================
model Company {
id Int @id @default(autoincrement())
name String
taxId String? @map("tax_id")
address String?
phone String?
email String?
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

stores Store[]

@@map("companies")
}

model Store {
id Int @id @default(autoincrement())
companyId Int @map("company_id")
name String
address String?
timezone String @default("Asia/Bangkok")
currency String @default("THB")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

company Company @relation(fields: [companyId], references: [id])
warehouses Warehouse[]
users User[]
materials Material[]
products Product[]
modifierGroups ModifierGroup[]
suppliers Supplier[]
posClients POSClient[]
sales Sale[]
syncMetadata SyncMetadata[]

@@map("stores")
}

model Warehouse {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
type String // 'main', 'bar', 'shisha', 'kitchen'
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

store Store @relation(fields: [storeId], references: [id])
inventory Inventory[]
inventoryTx InventoryTransaction[]
transfersFrom WarehouseTransfer[] @relation("TransferFrom")
transfersTo WarehouseTransfer[] @relation("TransferTo")
purchaseOrders PurchaseOrder[]
sales Sale[]

@@map("warehouses")
}

model WarehouseTransfer {
id Int @id @default(autoincrement())
fromWarehouseId Int @map("from_warehouse_id")
toWarehouseId Int @map("to_warehouse_id")
status String @default("pending") // pending, completed, cancelled
notes String?
createdBy Int @map("created_by")
createdAt DateTime @default(now()) @map("created_at")
completedAt DateTime? @map("completed_at")

fromWarehouse Warehouse @relation("TransferFrom", fields: [fromWarehouseId], references: [id])
toWarehouse Warehouse @relation("TransferTo", fields: [toWarehouseId], references: [id])
createdByUser User @relation(fields: [createdBy], references: [id])

@@map("warehouse_transfers")
}

// ==================== UTENTI & RBAC ====================
model Role {
id Int @id @default(autoincrement())
name String @unique
permissions Json // array di stringhe: ["product:read", "sale:create"]
description String?
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

users User[]

@@map("roles")
}

model User {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
roleId Int @map("role_id")
username String
pinHash String @map("pin_hash")
fullName String @map("full_name")
phone String?
email String?
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

store Store @relation(fields: [storeId], references: [id])
role Role @relation(fields: [roleId], references: [id])
sessions UserSession[]
sales Sale[]
shiftsOpened Shift[]
inventoryTx InventoryTransaction[]
purchaseOrders PurchaseOrder[]
cashMovements CashMovement[]
createdTransfers WarehouseTransfer[]

@@unique([storeId, username])
@@map("users")
}

model UserSession {
id Int @id @default(autoincrement())
userId Int @map("user_id")
posClientId Int? @map("pos_client_id")
token String
ipAddress String? @map("ip_address")
startedAt DateTime @default(now()) @map("started_at")
endedAt DateTime? @map("ended_at")
isValid Boolean @default(true) @map("is_valid")

user User @relation(fields: [userId], references: [id])
posClient POSClient? @relation(fields: [posClientId], references: [id])

@@map("user_sessions")
}

// ==================== MATERIALI (RAW) ====================
model Material {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
unit String // 'piece', 'gram', 'milliliter', 'bottle', 'can'
category String?
costPerUnit Decimal @default(0) @map("cost_per_unit") @db.Decimal(12, 4)
minStock Decimal? @map("min_stock") @db.Decimal(12, 4)
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

store Store @relation(fields: [storeId], references: [id])
recipes ProductRecipe[]
inventory Inventory[]
inventoryTx InventoryTransaction[]
poItems POItem[]
modifierOptions ModifierOption[]

@@map("materials")
}

// ==================== PRODOTTI ====================
model Product {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
categoryId Int? @map("category_id")
sku String?
basePrice Decimal @map("base_price") @db.Decimal(12, 2)
taxRate Decimal @default(0) @map("tax_rate") @db.Decimal(5, 2)
trackInventory Boolean @default(true) @map("track_inventory")
allowDecimalQty Boolean @default(false) @map("allow_decimal_qty")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

store Store @relation(fields: [storeId], references: [id])
category ProductCategory? @relation(fields: [categoryId], references: [id])
variants ProductVariant[]
recipes ProductRecipe[]
modifiers ProductModifier[]
saleItems SaleItem[]
addons ProductAddon[]

@@map("products")
}

model ProductCategory {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
color String?
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")

products Product[]

@@map("product_categories")
}

model ProductVariant {
id Int @id @default(autoincrement())
productId Int @map("product_id")
sku String?
name String // es. "Small", "Large"
priceAdjustment Decimal @default(0) @map("price_adjustment") @db.Decimal(12, 2)
isActive Boolean @default(true) @map("is_active")

product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
recipes ProductRecipe[]
saleItems SaleItem[]

@@map("product_variants")
}

// ==================== RICETTE / BOM ====================
model ProductRecipe {
id Int @id @default(autoincrement())
productId Int @map("product_id")
variantId Int? @map("variant_id") // null = tutte le varianti
materialId Int @map("material_id")
quantity Decimal @db.Decimal(12, 4)
unit String // unità di misura usata nella ricetta
wastagePercent Decimal @default(0) @map("wastage_percent") @db.Decimal(5, 2)

product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
variant ProductVariant? @relation(fields: [variantId], references: [id])
material Material @relation(fields: [materialId], references: [id])

@@map("product_recipes")
}

// ==================== MODIFIER & ADDON ====================
model ModifierGroup {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
selectionType String @map("selection_type") // 'single', 'multiple'
minSelect Int @default(0) @map("min_select")
maxSelect Int @default(1) @map("max_select")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

store Store @relation(fields: [storeId], references: [id])
options ModifierOption[]
products ProductModifier[]

@@map("modifier_groups")
}

model ModifierOption {
id Int @id @default(autoincrement())
groupId Int @map("group_id")
name String
priceAdjustment Decimal @default(0) @map("price_adjustment") @db.Decimal(12, 2)
materialId Int? @map("material_id") // se consuma materiale
quantityConsumed Decimal? @map("quantity_consumed") @db.Decimal(12, 4)
isActive Boolean @default(true) @map("is_active")

group ModifierGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
material Material? @relation(fields: [materialId], references: [id])
saleItems SaleItemModifier[]

@@map("modifier_options")
}

model ProductModifier {
id Int @id @default(autoincrement())
productId Int @map("product_id")
groupId Int @map("group_id")
isRequired Boolean @default(false) @map("is_required")
sortOrder Int @default(0) @map("sort_order")

product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
group ModifierGroup @relation(fields: [groupId], references: [id])

@@unique([productId, groupId])
@@map("product_modifiers")
}

// ==================== ADDON (DA IMPLEMENTARE) ====================
model ProductAddon {
id Int @id @default(autoincrement())
productId Int @map("product_id")
name String // es. "Bottiglie", "Bevande", ecc.
maxQuantity Int @default(0) @map("max_quantity") // 0 = illimitato
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
items ProductAddonItem[]

@@map("product_addons")
}

model ProductAddonItem {
id Int @id @default(autoincrement())
addonId Int @map("addon_id")
addonProductId Int @map("addon_product_id") // il prodotto che funge da addon
quantityValue Decimal @default(1) @map("quantity_value") @db.Decimal(12, 4) // es. caraffa = 3
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")

addon ProductAddon @relation(fields: [addonId], references: [id], onDelete: Cascade)
addonProduct Product @relation(fields: [addonProductId], references: [id], onDelete: Cascade)

@@unique([addonId, addonProductId])
@@map("product_addon_items")
}

// ==================== INVENTARIO ====================
model Inventory {
id Int @id @default(autoincrement())
warehouseId Int @map("warehouse_id")
materialId Int @map("material_id")
quantity Decimal @db.Decimal(12, 4)
reservedQuantity Decimal @default(0) @map("reserved_quantity") @db.Decimal(12, 4)
lastUpdated DateTime @updatedAt @map("last_updated")

warehouse Warehouse @relation(fields: [warehouseId], references: [id])
material Material @relation(fields: [materialId], references: [id])

@@unique([warehouseId, materialId])
@@map("inventory")
}

model InventoryTransaction {
id Int @id @default(autoincrement())
warehouseId Int @map("warehouse_id")
materialId Int @map("material_id")
type String // 'purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'waste', 'return'
quantity Decimal @db.Decimal(12, 4)
unitCost Decimal? @map("unit_cost") @db.Decimal(12, 4)
referenceId Int? @map("reference_id")
referenceType String? @map("reference_type")
notes String?
createdBy Int @map("created_by")
createdAt DateTime @default(now()) @map("created_at")

warehouse Warehouse @relation(fields: [warehouseId], references: [id])
material Material @relation(fields: [materialId], references: [id])
user User @relation(fields: [createdBy], references: [id])

@@map("inventory_transactions")
}

// ==================== ACQUISTI ====================
model Supplier {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
contact String?
phone String?
email String?
address String?
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

store Store @relation(fields: [storeId], references: [id])
purchaseOrders PurchaseOrder[]

@@map("suppliers")
}

model PurchaseOrder {
id Int @id @default(autoincrement())
warehouseId Int @map("warehouse_id")
supplierId Int @map("supplier_id")
status String @default("draft") // draft, ordered, partial, received, cancelled
total Decimal @default(0) @db.Decimal(12, 2)
notes String?
createdBy Int @map("created_by")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

warehouse Warehouse @relation(fields: [warehouseId], references: [id])
supplier Supplier @relation(fields: [supplierId], references: [id])
user User @relation(fields: [createdBy], references: [id])
items POItem[]

@@map("purchase_orders")
}

model POItem {
id Int @id @default(autoincrement())
poId Int @map("po_id")
materialId Int @map("material_id")
quantity Decimal @db.Decimal(12, 4)
unitPrice Decimal @map("unit_price") @db.Decimal(12, 4)
receivedQty Decimal @default(0) @map("received_qty") @db.Decimal(12, 4)

po PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
material Material @relation(fields: [materialId], references: [id])

@@map("po_items")
}

// ==================== POS CLIENTS ====================
model POSClient {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
name String
location String?
hardwareId String @map("hardware_id") // MAC o ID univoco macchina
lastSyncAt DateTime? @map("last_sync_at")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

store Store @relation(fields: [storeId], references: [id])
sessions UserSession[]
shifts Shift[]
sales Sale[]
syncData SyncMetadata[]

@@map("pos_clients")
}

// ==================== TURNI / CASSA ====================
model Shift {
id Int @id @default(autoincrement())
posClientId Int @map("pos_client_id")
userId Int @map("user_id")
openedAt DateTime @default(now()) @map("opened_at")
closedAt DateTime? @map("closed_at")
startingCash Decimal @map("starting_cash") @db.Decimal(12, 2)
expectedCash Decimal? @map("expected_cash") @db.Decimal(12, 2)
actualCash Decimal? @map("actual_cash") @db.Decimal(12, 2)
difference Decimal? @db.Decimal(12, 2)
status String @default("open") // open, closed, forced
notes String?

posClient POSClient @relation(fields: [posClientId], references: [id])
user User @relation(fields: [userId], references: [id])
sales Sale[]
cashMovements CashMovement[]

@@map("shifts")
}

model CashMovement {
id Int @id @default(autoincrement())
shiftId Int @map("shift_id")
type String // 'in', 'out', 'adjustment'
amount Decimal @db.Decimal(12, 2)
reason String?
createdBy Int @map("created_by")
createdAt DateTime @default(now()) @map("created_at")

shift Shift @relation(fields: [shiftId], references: [id])
user User @relation(fields: [createdBy], references: [id])

@@map("cash_movements")
}

// ==================== VENDITE ====================
model Sale {
id Int @id @default(autoincrement())
storeId Int @map("store_id")
warehouseId Int @map("warehouse_id")
posClientId Int @map("pos_client_id")
shiftId Int @map("shift_id")
userId Int @map("user_id")
saleNumber String @map("sale_number") // univoco per sede
subtotal Decimal @db.Decimal(12, 2)
taxTotal Decimal @map("tax_total") @db.Decimal(12, 2)
discountTotal Decimal @default(0) @map("discount_total") @db.Decimal(12, 2)
total Decimal @db.Decimal(12, 2)
status String @default("completed") // completed, refunded, cancelled, pending
customerCount Int? @map("customer_count")
tableNumber String? @map("table_number")
notes String?
createdAt DateTime @default(now()) @map("created_at")
syncedAt DateTime? @map("synced_at")

store Store @relation(fields: [storeId], references: [id])
warehouse Warehouse @relation(fields: [warehouseId], references: [id])
posClient POSClient @relation(fields: [posClientId], references: [id])
shift Shift @relation(fields: [shiftId], references: [id])
user User @relation(fields: [userId], references: [id])
items SaleItem[]
payments Payment[]

@@unique([storeId, saleNumber])
@@map("sales")
}

model SaleItem {
id Int @id @default(autoincrement())
saleId Int @map("sale_id")
productId Int @map("product_id")
variantId Int? @map("variant_id")
quantity Decimal @db.Decimal(12, 4)
unitPrice Decimal @map("unit_price") @db.Decimal(12, 2)
totalPrice Decimal @map("total_price") @db.Decimal(12, 2)
costAtSale Decimal? @map("cost_at_sale") @db.Decimal(12, 4) // per margini
discountAmount Decimal @default(0) @map("discount_amount") @db.Decimal(12, 2)

sale Sale @relation(fields: [saleId], references: [id], onDelete: Cascade)
product Product @relation(fields: [productId], references: [id])
variant ProductVariant? @relation(fields: [variantId], references: [id])
modifiers SaleItemModifier[]
addons SaleItemAddon[]

@@map("sale_items")
}

model SaleItemModifier {
id Int @id @default(autoincrement())
saleItemId Int @map("sale_item_id")
modifierOptionId Int @map("modifier_option_id")
quantity Int @default(1)
priceAdjustment Decimal @default(0) @map("price_adjustment") @db.Decimal(12, 2)

saleItem SaleItem @relation(fields: [saleItemId], references: [id], onDelete: Cascade)
modifierOption ModifierOption @relation(fields: [modifierOptionId], references: [id])

@@map("sale_item_modifiers")
}

model SaleItemAddon {
id Int @id @default(autoincrement())
saleItemId Int @map("sale_item_id")
addonProductId Int @map("addon_product_id")
quantity Decimal @default(1) @db.Decimal(12, 4)
quantityValue Decimal @default(1) @map("quantity_value") @db.Decimal(12, 4)
unitPrice Decimal @map("unit_price") @db.Decimal(12, 2)
totalPrice Decimal @map("total_price") @db.Decimal(12, 2)

saleItem SaleItem @relation(fields: [saleItemId], references: [id], onDelete: Cascade)
addonProduct Product @relation(fields: [addonProductId], references: [id])

@@map("sale_item_addons")
}

model Payment {
id Int @id @default(autoincrement())
saleId Int @map("sale_id")
method String // 'cash', 'card', 'qr', 'transfer', 'voucher'
amount Decimal @db.Decimal(12, 2)
reference String? // ref transazione esterna
isRefunded Boolean @default(false) @map("is_refunded")
refundedAt DateTime? @map("refunded_at")

sale Sale @relation(fields: [saleId], references: [id], onDelete: Cascade)

@@map("payments")
}

// ==================== SYNC ====================
model SyncMetadata {
id Int @id @default(autoincrement())
posClientId Int @map("pos_client_id")
storeId Int @map("store_id")
entityType String @map("entity_type") // 'product', 'modifier', 'user', 'price'
lastVersion Int @map("last_version") // versione o timestamp
lastSyncAt DateTime @map("last_sync_at")

posClient POSClient @relation(fields: [posClientId], references: [id])
store Store @relation(fields: [storeId], references: [id])

@@unique([posClientId, entityType])
@@map("sync_metadata")
}

---

Note sullo schema Prisma
Fix applicati rispetto al codice attuale

1. User.cashMovements: rimossa la @relation esplicita errata. Prisma inferisce automaticamente dal createdBy di CashMovement.
2. User.createdTransfers: rimossa la @relation esplicita errata. Prisma inferisce automaticamente dal createdBy di WarehouseTransfer.
3. CashMovement: aggiunta la relazione user User @relation(fields: [createdBy], references: [id]).
   Nuove entità (da implementare)
   • ProductAddon: raggruppa gli addon per prodotto (es. “Bottiglie” con max 4)
   • ProductAddonItem: singoli prodotti-addon nella lista (es. Grey Goose, CocaCola) con quantityValue
   • SaleItemAddon: traccia gli addon selezionati in una vendita

---

Concetti chiave: Modifier vs Addon
Modifier (GIÀ IMPLEMENTATI)
• Sono attributi/varianti del prodotto stesso
• Esempi: no ice, small, large, extra hot
• Non sono prodotti vendibili separatamente
• Gestiti da ModifierGroup → ModifierOption → ProductModifier
Addon (DA IMPLEMENTARE)
• Sono prodotti/materiali vendibili separatamente che si agganciano a un prodotto principale
• Esempio pratico: Bottiglia Grey Goose 750ml → max 4 addon
– Lista addon: bottiglie varie, CocaCola, Sprite, caraffa di succo…
• Ogni addon nella lista ha un quantityValue che indica “quanto vale” in termini di consumo:
– Can di CocaCola → quantityValue = 1
– Caraffa di succo → quantityValue = 3 (vale come 3 unità)
• Gli addon sono a tutti gli effetti Product (hanno basePrice, sku, ecc.)
• La relazione è Product → ProductAddon → ProductAddonItem → Product

---

Backend - Moduli esistenti
src/
├── app.module.ts # Importa: Prisma, Auth, Products, Materials, Sales, Users
├── prisma/
│ └── schema.prisma # Schema completo (vedi sopra)
├── products/
│ ├── products.service.ts # CRUD prodotti, varianti, ricette, modifier, sync POS
│ ├── products.controller.ts
│ └── dto/ # CreateProductDto, UpdateProductDto, etc.
├── materials/
├── sales/
├── auth/
└── users/
Moduli da creare (roadmap)
• inventory/ — stock, movimenti, adjustment
• purchases/ — PO, ricevimento merci
• pos-clients/ — registrazione client, sync
• sync/ — endpoint dedicati alla sincronizzazione
• reports/ — report interni sede
• websocket/ — gateway per push real-time
• cloud-sync/ — batch export verso cloud dashboard
• rbac/ — decorator @RequirePermission, guard
• stores/ — gestione sede
• warehouses/ — magazzini, trasferimenti
Endpoint sync POS
GET /products/pos-sync (o simile) → ProductsService.getProductsForPOS()
Restituisce prodotti attivi con: category, variants, recipes, modifiers (con options).
DA AGGIUNGERE: includere anche gli addon nella risposta sync.

---

Frontend Admin - Routing
/login
/ (layout protetto)
├── /dashboard
├── /products
├── /materials
├── /users
└── /sales-report
DA AGGIUNGERE: pagina/gestione addon nel percorso /products o dedicato /addons.

---

Cosa è fatto ✅
• ☒ Schema Prisma completo per tutte le entità core
• ☒ CRUD prodotti, varianti, ricette, modifier groups, modifier options
• ☒ Assegnazione modifier ai prodotti (ProductModifier)
• ☒ Gestione inventario, acquisti, turni, vendite
• ☒ Endpoint sync per POS (getProductsForPOS)
• ☒ Frontend admin con routing base e guard auth
• ☒ Auth JWT + PIN per utenti POS

---

Cosa manca / Roadmap 🚧
Fase 1: Database & Backend Addon
• ☐ Aggiungere ProductAddon, ProductAddonItem, SaleItemAddon allo schema Prisma
• ☐ Creare migration Prisma (npx prisma migrate dev)
• ☐ Creare DTO: CreateProductAddonDto, CreateProductAddonItemDto, UpdateProductAddonDto
• ☐ Creare ProductAddonService e ProductAddonController
• ☐ Aggiornare ProductsService per gestire addon nel create/update product
• ☐ Aggiornare getProductsForPOS per includere addon nella risposta sync
• ☐ Aggiornare SaleItem / logica vendite per gestire consumo inventario addon
Fase 2: Frontend Admin Addon
• ☐ Aggiornare modello Product per includere addons
• ☐ Creare componente gestione addon nella pagina prodotti
• ☐ UI per selezionare prodotti-addon dalla lista esistente
• ☐ Campo quantityValue per ogni addon item
• ☐ Campo maxQuantity a livello di ProductAddon
Fase 3: POS Client (C# WPF)
• ☐ Aggiornare modello dati locale (SQLite) per ricevere addon dal sync
• ☐ UI POS: mostrare addon quando un prodotto viene selezionato
• ☐ Selezione addon con quantità (rispettando maxQuantity)
• ☐ Inviare addon nella struttura SaleItem al backend
• ☐ Gestire offline sync per addon
Fase 4: Inventario & Reporting
• ☐ Consumo materiale per addon nelle vendite
• ☐ Report margini che includono costo addon
• ☐ Alert stock per materiali consumati come addon

---

Decisioni architetturali prese

1. Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entità separate. Si collegano tramite tabelle ponte.
2. quantityValue su ProductAddonItem: definisce il “peso” dell’addon (es. caraffa = 3), diverso dalla quantità venduta.
3. maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
4. Soft delete: tutte le entità usano isActive invece di cancellazione fisica.
5. Multi-sede: ogni entità è scoped su storeId.
6. POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.

---

Note per il debugging
• Il backend gira su http://localhost:3000
• Il frontend admin su http://localhost:4200
• CORS già configurato per origini localhost:4200 e 127.0.0.1:4200
• Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema
• Dopo modifiche allo schema: npx prisma migrate dev --name <nome>

---

Come usare questo file nelle nuove chat
Quando riapri una nuova sessione, fornisci questo link:
https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md
E digita: “Leggi il PROJECT_CONTEXT.md e aggiorniamo gli addon.”

---

Generato il 2026-06-24. Modifica e aggiorna liberamente.

POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuità tra sessioni di lavoro.
Aggiorna la sezione “Ultimo aggiornamento” ogni volta che modifichi qualcosa.

---

Ultimo aggiornamento
2026-06-24
Stack tecnologico
Layer Tecnologia Versione / Note
Backend sede NestJS v11, TypeScript
ORM Prisma v5.22.0, PostgreSQL
DB Sede PostgreSQL 16+ JSONB per varianti/modifier flessibili, replication ready
Frontend gestione Angular v21.2.16, Signals (@if/@for, signal(), computed())
POS Client C# WPF .NET MVVM, SQLite locale per offline
Comunicazione REST API + WebSocket REST per bulk sync; WebSocket per aggiornamenti real-time
Auth JWT + Passport PIN-based per utenti POS

---

Pattern frontend (Angular)
REGOLA FERMA: Tutta la reattività UI usa Angular Signals (signal(), computed()).
MAI usare proprietà plain o \*ngIf per stato che deve aggiornare la UI.
Usare sempre @if / @for (control flow) nei template.

---

Database - Stato entità
Entità Stato Note
Company ✅ Multi-sede base
Store ✅ Collega tutto al negozio
Warehouse ✅ Tipi: main, bar, shisha, kitchen
Role / User / UserSession ✅ RBAC con permissions JSON
Material ✅ Unità: piece, gram, milliliter, bottle, can
Product ✅ basePrice, taxRate, trackInventory, allowDecimalQty
ProductCategory ✅ Con colore e sortOrder
ProductVariant ✅ Esempio: Small, Large, priceAdjustment
ProductRecipe ✅ BOM per consumo materiali (variantId opzionale)
ModifierGroup ✅ selectionType: single/multiple, min/max select
ModifierOption ✅ priceAdjustment, materialId, quantityConsumed
ProductModifier ✅ Collega Product ↔ ModifierGroup (isRequired, sortOrder)
Inventory / InventoryTransaction ✅ Traccia giacenza e movimenti
Supplier / PurchaseOrder / POItem ✅ Ordini acquisto
POSClient ✅ Hardware ID, lastSyncAt
Shift / CashMovement ✅ Turni cassa
Sale / SaleItem / SaleItemModifier / Payment ✅ Vendite complete
SyncMetadata ✅ Per sync POS offline
ProductAddon ✅ Tabella ponte: Product → Addon (maxQuantity, sortOrder)
ProductAddonItem ✅ Lista prodotti-addon con quantityValue
SaleItemAddon ✅ Traccia addon selezionati in una vendita

---

Schema Prisma completo (attuale)
Vedere prisma/schema.prisma nel repository. Le modifiche più recenti includono: - Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user) - Nuove tabelle: ProductAddon, ProductAddonItem, SaleItemAddon - Campo clientSaleId su Sale (per sync POS)

---

Concetti chiave: Modifier vs Addon
Modifier (GIÀ IMPLEMENTATI)
• Sono attributi/varianti del prodotto stesso
• Esempi: no ice, small, large, extra hot
• Non sono prodotti vendibili separatamente
• Gestiti da ModifierGroup → ModifierOption → ProductModifier
Addon (IMPLEMENTATI)
• Sono prodotti/materiali vendibili separatamente che si agganciano a un prodotto principale
• Esempio pratico: Bottiglia Grey Goose 750ml → max 4 addon
– Lista addon: bottiglie varie, CocaCola, Sprite, caraffa di succo…
• Ogni addon nella lista ha un quantityValue che indica “quanto vale” in termini di consumo:
– Can di CocaCola → quantityValue = 1
– Caraffa di succo → quantityValue = 3 (vale come 3 unità)
• Gli addon sono a tutti gli effetti Product (hanno basePrice, sku, ecc.)
• La relazione è Product → ProductAddon → ProductAddonItem → Product

---

Backend - Moduli esistenti
src/
├── app.module.ts # Importa: Prisma, Auth, Products, Materials, Sales, Users, ProductAddon
├── prisma/
│ └── schema.prisma # Schema completo con addon
├── products/
│ ├── products.service.ts # CRUD prodotti, varianti, ricette, modifier, addon, sync POS
│ ├── products.controller.ts
│ └── dto/ # CreateProductDto (con addons inline), UpdateProductDto, etc.
├── product-addon/
│ ├── product-addon.service.ts
│ ├── product-addon.controller.ts
│ ├── product-addon.module.ts
│ └── dto/
│ ├── create-product-addon.dto.ts
│ └── update-product-addon.dto.ts
├── materials/
├── sales/
├── auth/
└── users/
Moduli da creare (roadmap)
• inventory/ — stock, movimenti, adjustment
• purchases/ — PO, ricevimento merci
• pos-clients/ — registrazione client, sync
• sync/ — endpoint dedicati alla sincronizzazione
• reports/ — report interni sede
• websocket/ — gateway per push real-time
• cloud-sync/ — batch export verso cloud dashboard
• rbac/ — decorator @RequirePermission, guard
• stores/ — gestione sede
• warehouses/ — magazzini, trasferimenti
Endpoint sync POS
GET /products/pos-sync → ProductsService.getProductsForPOS()
Restituisce prodotti attivi con: category, variants, recipes, modifiers, addons (con items).
Endpoint addon
• POST /product-addons — crea un addon group
• GET /product-addons/product/:productId — lista addon di un prodotto
• GET /product-addons/:id — dettaglio addon
• PATCH /product-addons/:id — aggiorna addon
• DELETE /product-addons/:id — soft delete addon

---

Frontend Admin - Routing
/login
/ (layout protetto)
├── /dashboard
├── /products
├── /materials
├── /users
└── /sales-report
DA AGGIUNGERE: pagina/gestione addon nel percorso /products o dedicato /addons.

---

Cosa è fatto ✅
• ☒ Schema Prisma completo per tutte le entità core
• ☒ Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user)
• ☒ CRUD prodotti, varianti, ricette, modifier groups, modifier options
• ☒ Assegnazione modifier ai prodotti (ProductModifier)
• ☒ Nuove tabelle addon: ProductAddon, ProductAddonItem, SaleItemAddon
• ☒ ProductAddonService e ProductAddonController con CRUD completo
• ☒ ProductsService aggiornato per gestire addon inline nel create/update
• ☒ getProductsForPOS aggiornato per includere addon nella risposta sync
• ☒ Gestione inventario, acquisti, turni, vendite
• ☒ Endpoint sync per POS (getProductsForPOS)
• ☒ Frontend admin con routing base e guard auth
• ☒ Auth JWT + PIN per utenti POS

---

Cosa manca / Roadmap 🚧
Fase 1: Database & Backend Addon ✅ COMPLETATA
• ☒ Aggiungere ProductAddon, ProductAddonItem, SaleItemAddon allo schema Prisma
• ☒ Creare migration Prisma
• ☒ Creare DTO: CreateProductAddonDto, CreateProductAddonItemDto, UpdateProductAddonDto
• ☒ Creare ProductAddonService e ProductAddonController
• ☒ Aggiornare ProductsService per gestire addon nel create/update product
• ☒ Aggiornare getProductsForPOS per includere addon nella risposta sync
• ☐ Aggiornare SaleItem / logica vendite per gestire consumo inventario addon
Fase 2: Frontend Admin Addon
• ☐ Aggiornare modello Product per includere addons
• ☐ Creare componente gestione addon nella pagina prodotti
• ☐ UI per selezionare prodotti-addon dalla lista esistente
• ☐ Campo quantityValue per ogni addon item
• ☐ Campo maxQuantity a livello di ProductAddon
Fase 3: POS Client (C# WPF)
• ☐ Aggiornare modello dati locale (SQLite) per ricevere addon dal sync
• ☐ UI POS: mostrare addon quando un prodotto viene selezionato
• ☐ Selezione addon con quantità (rispettando maxQuantity)
• ☐ Inviare addon nella struttura SaleItem al backend
• ☐ Gestire offline sync per addon
Fase 4: Inventario & Reporting
• ☐ Consumo materiale per addon nelle vendite
• ☐ Report margini che includono costo addon
• ☐ Alert stock per materiali consumati come addon

---

Decisioni architetturali prese

1. Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entità separate. Si collegano tramite tabelle ponte.
2. quantityValue su ProductAddonItem: definisce il “peso” dell’addon (es. caraffa = 3), diverso dalla quantità venduta.
3. maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
4. Soft delete: tutte le entità usano isActive invece di cancellazione fisica.
5. Multi-sede: ogni entità è scoped su storeId.
6. POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.

---

Note per il debugging
• Il backend gira su http://localhost:3000
• Il frontend admin su http://localhost:4200
• CORS già configurato per origini localhost:4200 e 127.0.0.1:4200
• Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema
• Dopo modifiche allo schema: npx prisma migrate dev --name <nome>

---

Come usare questo file nelle nuove chat
Quando riapri una nuova sessione, fornisci questo link:
https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md
E digita: “Leggi il PROJECT_CONTEXT.md e aggiorniamo gli addon.”

---

Generato il 2026-06-24. Modifica e aggiorna liberamente.
