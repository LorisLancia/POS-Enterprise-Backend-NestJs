POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuità tra sessioni di lavoro. Aggiorna la sezione “Ultimo aggiornamento” ogni volta che modifichi qualcosa.

---

Ultimo aggiornamento
2026-06-24
Stack tecnologico
Layer Tecnologia Versione / Note
Backend NestJS v11, TypeScript
ORM Prisma v5.22.0, PostgreSQL
Frontend Admin Angular v21.2.16, Signals (@if/@for, signal(), computed())
POS Client Angular (repo separato: POS.Client)
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
ProductAddon ❌ NON sono sicuro se manca → Addon (maxQuantity, sortOrder)
ProductAddonItem ❌ NON sono sicuro se manca -addon con quantityValue

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
• ☐ Aggiungere ProductAddon e ProductAddonItem allo schema Prisma
• ☐ Creare migration Prisma
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
Fase 3: POS Client
• ☐ Aggiornare modello dati locale per ricevere addon dal sync
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
3. maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie).
4. Soft delete: tutte le entità usano isActive invece di cancellazione fisica.
5. Multi-sede: ogni entità è scoped su storeId.

---

Note per il debugging
• Il backend gira su http://localhost:3000
• Il frontend admin su http://localhost:4200
• CORS già configurato per origini localhost:4200 e 127.0.0.1:4200
• Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema

---

Come usare questo file nelle nuove chat
Quando riapri una nuova sessione, fornisci questo link:
https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md
E digita: “Leggi il PROJECT_CONTEXT.md e aggiorniamo gli addon.”

---

Generato il 2026-06-24. Modifica e aggiorna liberamente.
