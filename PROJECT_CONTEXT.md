POS Enterprise - Project Context File di contesto condiviso per mantenere la continuità tra sessioni di lavoro. Aggiorna la sezione “Ultimo aggiornamento” ogni volta che modifichi qualcosa.

---

Ultimo aggiornamento 2026-06-25
Repository GitHub | Repo | URL | Tecnologia | |——|—–|————| | Backend | https://github.com/LorisLancia/POS-Enterprise-Backend-NestJs.git | NestJS + Prisma + PostgreSQL | | Frontend Admin | https://github.com/LorisLancia/POS-Enterprise-Frontend-Angular.git | Angular 21 (Signals) | | POS Client | https://github.com/LorisLancia/POS.Client.git | C# WPF .NET + SQLite |

---

Stack tecnologico | Layer | Tecnologia | Versione / Note | |——-|————|—————–| | Backend sede | NestJS | v11, TypeScript | | ORM | Prisma | v5.22.0, PostgreSQL | | DB Sede | PostgreSQL | 16+ JSONB per varianti/modifier flessibili, replication ready | | Frontend gestione | Angular | v21.2.16, Signals (@if/@for, signal(), computed()) | | POS Client | C# WPF .NET | MVVM, SQLite locale per offline | | Comunicazione | REST API + WebSocket | REST per bulk sync; WebSocket per real-time | | Auth | JWT + Passport | PIN-based per utenti POS |

---

Pattern frontend (Angular) REGOLA FERMA: Tutta la reattività UI usa Angular Signals (signal(), computed()). MAI usare proprietà plain o \*ngIf per stato che deve aggiornare la UI. Usare sempre @if / @for (control flow) nei template.

---

Struttura Frontend (models / services) Tutte le interfacce sono centralizzate in core/models/: - auth.model.ts → AuthUser, LoginResponse - user.model.ts → User, Role, UserRole - sale.model.ts → Sale, SaleItem, Payment, SalesReport - material.model.ts → Material, InventoryItem, InventoryTransactionDto - unit.model.ts → Unit - unit-conversion.model.ts → UnitConversion - product.model.ts → Product, ProductVariant, ProductRecipe, ModifierGroup, ModifierOption, ProductModifier, ProductAddon, ProductAddonItem, ProductCategory - product-addon.model.ts → CreateProductAddonDto, UpdateProductAddonDto, ProductAddonItemDto
Tutti i service importano i modelli da core/models/: - AuthService → auth.model.ts - UsersService → user.model.ts - SalesService → sale.model.ts - MaterialsService → material.model.ts - UnitsService → unit.model.ts - UnitConversionsService → unit-conversion.model.ts - ProductsService → product.model.ts - ProductAddonService → product.model.ts + product-addon.model.ts - ProductCategoriesService → product.model.ts

---

Database - Stato entità | Entità | Stato | Note | |——–|——-|——| | Company | ✅ | Multi-sede base | | Store | ✅ | Collega tutto al negozio | | Warehouse | ✅ | Tipi: main, bar, shisha, kitchen | | Role / User / UserSession | ✅ | RBAC con permissions JSON | | Unit | ✅ | Unità di misura referenziate (piece, volume, weight, container) | | UnitConversion | ✅ | Conversioni tra unità (es. 1 box = 6 btl, 1 btl = 750 ml) | | Material | ✅ | FK su Unit (unitId), categorie gestite via input | | Product | ✅ | basePrice, taxRate, trackInventory, allowDecimalQty | | ProductCategory | ✅ | Con colore e sortOrder | | ProductVariant | ✅ | Small, Large, priceAdjustment | | ProductRecipe | ✅ | BOM con FK su Unit (unitId), variantId opzionale | | ModifierGroup | ✅ | selectionType: single/multiple, min/max select | | ModifierOption | ✅ | priceAdjustment, materialId, quantityConsumed | | ProductModifier | ✅ | Collega Product ↔ ModifierGroup (isRequired, sortOrder) | | Inventory / InventoryTransaction | ✅ | Traccia giacenza e movimenti | | Supplier / PurchaseOrder / POItem | ✅ | Ordini acquisto | | POSClient | ✅ | Hardware ID, lastSyncAt | | Shift / CashMovement | ✅ | Turni cassa | | Sale / SaleItem / SaleItemModifier / Payment | ✅ | Vendite complete | | SyncMetadata | ✅ | Per sync POS offline | | ProductAddon | ✅ | Tabella ponte: Product → Addon (maxQuantity, sortOrder) | | ProductAddonItem | ✅ | Lista prodotti-addon con quantityValue | | SaleItemAddon | ✅ | Traccia addon selezionati in una vendita |

---

Schema Prisma completo (attuale) Vedere prisma/schema.prisma nel repository. Modifiche recenti: - Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user) - Nuove tabelle: ProductAddon, ProductAddonItem, SaleItemAddon - Nuove tabelle: Unit, UnitConversion (con relazioni Store ↔ Unit, Unit ↔ UnitConversion) - Material.unit (string) → Material.unitId (FK → Unit) - ProductRecipe.unit (string) → ProductRecipe.unitId (FK → Unit) - Campo clientSaleId su Sale (per sync POS)

---

Concetti chiave: Modifier vs Addon vs Unit
Modifier (GIÀ IMPLEMENTATI) - Sono attributi/varianti del prodotto stesso - Esempi: no ice, small, large, extra hot - Non sono prodotti vendibili separatamente - Gestiti da ModifierGroup → ModifierOption → ProductModifier
Addon (IMPLEMENTATI) - Sono prodotti/materiali vendibili separatamente che si agganciano a un prodotto principale - Esempio: Bottiglia Grey Goose 750ml → max 4 addon - Relazione: Product → ProductAddon → ProductAddonItem → Product - UI POS: selezione con quantità, rispetto maxQuantity
Unit (IMPLEMENTATE) - Unità di misura referenziate: piece, gram, milliliter, bottle, can, box, glass - Ogni materiale ha una unità base (FK unitId) - Ogni ricetta (BOM) specifica la unità di consumo (FK unitId) - Le conversioni tra unità (UnitConversion) permettono di tracciare: - Acquisto: 1 box = 6 bottiglie - Stoccaggio: 1 bottiglia = 750 ml - Vendita: 1 bicchiere = 30 ml

---

Backend - Moduli esistenti
src/
├── app.module.ts # Prisma, Auth, Products, Materials, Sales, Users, ProductAddon, ProductCategories, Units, UnitConversions
├── prisma/
│ └── schema.prisma # Schema completo con addon, unit, unit_conversions
├── products/
│ ├── products.service.ts # CRUD prodotti, varianti, ricette, modifier, addon, sync POS
│ ├── products.controller.ts
│ └── dto/
├── product-addon/
│ ├── product-addon.service.ts
│ ├── product-addon.controller.ts
│ ├── product-addon.module.ts
│ └── dto/
├── product-categories/
│ ├── product-categories.service.ts # CRUD categorie prodotto
│ ├── product-categories.controller.ts
│ ├── product-categories.module.ts
│ └── dto/
├── units/
│ ├── units.service.ts # CRUD unità di misura
│ ├── units.controller.ts
│ ├── units.module.ts
│ └── dto/
├── unit-conversions/
│ ├── unit-conversions.service.ts # CRUD conversioni unità
│ ├── unit-conversions.controller.ts
│ ├── unit-conversions.module.ts
│ └── dto/
├── materials/
├── sales/
├── auth/
└── users/
Moduli da creare (roadmap) - inventory/ — stock, movimenti, adjustment (con logica conversioni unità) - purchases/ — PO, ricevimento merci (con unità acquisto vs unità stoccaggio) - pos-clients/ — registrazione client, sync - sync/ — endpoint dedicati alla sincronizzazione - reports/ — report interni sede - websocket/ — gateway per push real-time - cloud-sync/ — batch export verso cloud dashboard - rbac/ — decorator @RequirePermission, guard (esiste parzialmente) - stores/ — gestione sede - warehouses/ — magazzini, trasferimenti
Endpoint sync POS - GET /products/pos-sync → ProductsService.getProductsForPOS() - Restituisce prodotti attivi con: category, variants, recipes (con unit), modifiers, addons (con items)
Endpoint addon - POST /product-addons — crea addon group - GET /product-addons/product/:productId — lista addon di un prodotto - GET /product-addons/:id — dettaglio addon - PATCH /product-addons/:id — aggiorna addon - DELETE /product-addons/:id — soft delete addon
Endpoint categorie - GET /product-categories — lista per store - POST /product-categories — crea categoria - PATCH /product-categories/:id — aggiorna categoria - DELETE /product-categories/:id — soft delete categoria
Endpoint unità - GET /units — lista unità per store - POST /units — crea unità - PATCH /units/:id — aggiorna unità - DELETE /units/:id — soft delete unità
Endpoint conversioni - GET /unit-conversions — lista conversioni per store - POST /unit-conversions — crea conversione (fromUnitId, toUnitId, factor) - PATCH /unit-conversions/:id — aggiorna conversione - DELETE /unit-conversions/:id — soft delete conversione

---

Frontend Admin - Routing
/login
/ (layout protetto)
├── /dashboard
├── /products
│ └── ProductAddonManagerComponent (inline per addon)
├── /categories # CRUD ProductCategory
├── /materials # CRUD Material (con dropdown Unit)
├── /units # CRUD Unit
├── /unit-conversions # CRUD UnitConversion
├── /users
└── /sales-report
Componenti principali - ProductsComponent — lista prodotti con CRUD completo - Form creazione: campi base + Variants + Recipes (con dropdown Unit) + Modifier Groups - Form modifica: campi base (variants/ricette/modifier non editabili inline) - Addon manager button → ProductAddonManagerComponent - ProductAddonManagerComponent — gestione addon per prodotto (standalone, Signals) - CategoriesComponent — CRUD categorie (standalone, Signals) - MaterialsComponent — CRUD materiali (standalone, Signals, dropdown Unit) - UnitsComponent — CRUD unità di misura (standalone, Signals) - UnitConversionsComponent — CRUD conversioni tra unità (standalone, Signals)

---

POS Client (C# WPF) - Stato
Modelli dati SQLite - LocalProduct — con Addons (List) - LocalProductAddon — con Items (List) - LocalProductAddonItem — con AddonProductId, QuantityValue - LocalSaleItemAddon — con AddonProductId, Quantity, QuantityValue, UnitPrice, TotalPrice - LocalMaterial — con Unit (string display)
Servizi - ApiService — REST client con RestSharp, JWT auth - SyncService — scarica prodotti, varianti, modifier, addon, inventario dal backend - OfflineQueueService — salva vendite offline, sync asincrono con retry
UI Vendita - CashierWindow — griglia prodotti, carrello, pagamento - ProductOptionWindow — selezione modifier per prodotto - AddonSelectionWindow — selezione addon con quantità (± bottoni), rispetto maxQuantity - Flusso: Prodotto → Addon (se presenti) → Modifier (se presenti) → Variante (se presenti) → Cart

---

Cosa è fatto ✅ - Schema Prisma completo per tutte le entità core - Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user) - CRUD prodotti, varianti, ricette, modifier groups, modifier options - Assegnazione modifier ai prodotti (ProductModifier) - Nuove tabelle addon: ProductAddon, ProductAddonItem, SaleItemAddon - Nuove tabelle unità: Unit, UnitConversion - Material.unit (string) → Material.unitId (FK → Unit) - ProductRecipe.unit (string) → ProductRecipe.unitId (FK → Unit) - ProductAddonService e ProductAddonController con CRUD completo - UnitsService e UnitsController con CRUD completo - UnitConversionsService e UnitConversionsController con CRUD completo - ProductCategoriesService e ProductCategoriesController con CRUD completo - ProductsService aggiornato per gestire addon inline nel create/update - ProductsService aggiornato per includere unit nelle ricette (include: { unit: true }) - MaterialsService aggiornato per includere unit nei materiali (include: { unit: true }) - getProductsForPOS aggiornato per includere addon e unit nella risposta sync - Frontend: ProductAddonManagerComponent con Signals per gestire addon - Frontend: ProductAddonService per chiamare API addon - Frontend: Product model centralizzato in core/models/product.model.ts - Frontend: Pagina /categories con CRUD completo (nome, colore, sortOrder) - Frontend: Pagina /materials con CRUD completo (dropdown Unit) - Frontend: Pagina /units con CRUD completo (nome, simbolo, tipo) - Frontend: Pagina /unit-conversions con CRUD completo (da, a, fattore) - Frontend: Form prodotto completo in creazione (base + variants + recipes con dropdown Unit + modifiers) - Frontend: Allineamento modello Product (price → basePrice, category → categoryId) - Frontend: Dropdown categorie nel form prodotto - Frontend: Tutti i modelli spostati in core/models/ (auth, user, sale, material, unit, unit-conversion, product, product-addon) - Frontend: Tutti i service puliti e allineati ai modelli - POS Client: AddonSelectionWindow (UI per selezionare addon con quantità) - POS Client: CashierWindow aggiornato (flusso addon → modifier → variant) - POS Client: SyncService aggiornato (salva addon nel DB locale con relazioni SQLite) - POS Client: OfflineQueueService aggiornato (invia addon al backend nel DTO vendita) - POS Client: POSDbContext aggiornato con relazioni Product→Addon→Items, SaleItem→Addon - POS Client: Fix ApiService.MaterialResponse (Unit come oggetto UnitResponse) - POS Client: Fix SyncService (AddonId = ServerId, non LocalId) - Gestione inventario, acquisti, turni, vendite - Endpoint sync per POS (getProductsForPOS) - Frontend admin con routing base e guard auth - Auth JWT + PIN per utenti POS - POS Client: SyncService scarica addon dal backend - POS Client: POSDbContext con DbSet per addon

---

Cosa manca / Roadmap 🚧
Fase 1: Database & Backend Addon ✅ COMPLETATA - Aggiungere ProductAddon, ProductAddonItem, SaleItemAddon allo schema Prisma - Creare migration Prisma - Creare DTO: CreateProductAddonDto, CreateProductAddonItemDto, UpdateProductAddonDto - Creare ProductAddonService e ProductAddonController - Aggiornare ProductsService per gestire addon nel create/update product - Aggiornare getProductsForPOS per includere addon nella risposta sync - ☐ Aggiornare SaleItem / logica vendite per gestire consumo inventario addon
Fase 2: Frontend Admin Addon ✅ COMPLETATA - Aggiornare modello Product per includere addons - Creare componente gestione addon nella pagina prodotti - UI per selezionare prodotti-addon dalla lista esistente - Campo quantityValue per ogni addon item - Campo maxQuantity a livello di ProductAddon - Pagina /categories per gestire ProductCategory ✅ - Form prodotto completo con dropdown categoria, varianti, ricette, modifier ✅ - Allineamento modello frontend con backend (price → basePrice, category → categoryId) ✅
Fase 2b: Unità & Conversioni ✅ COMPLETATA - Creare Unit e UnitConversion nello schema Prisma - Migration con dati seed (piece, gram, ml, bottle, can, box, glass) - CRUD backend: UnitsModule, UnitConversionsModule - CRUD frontend: UnitsComponent, UnitConversionsComponent - Material usa unitId (FK) invece di unit string - ProductRecipe usa unitId (FK) invece di unit string - Dropdown unità in form materiali e form ricette prodotti - ☐ Manca: Logica inventario che usa le conversioni per calcolare consumo
Fase 3: POS Client (C# WPF) 🚧 IN CORSO - Modelli dati SQLite per addon (LocalProductAddon, LocalProductAddonItem, LocalSaleItemAddon) - SyncService scarica addon dal backend - POSDbContext con DbSet per addon - UI addon: AddonSelectionWindow con quantità e rispetto maxQuantity ✅ - Flusso vendita: addon → modifier → variant → cart ✅ - Salvataggio addon nella vendita locale e sync al backend ✅ - ☐ Manca: Gestire offline sync per addon (già funzionante con OfflineQueueService) - ☐ Manca: UI WPF per mostrare addon selezionati nel carrello (testuale funziona, grafica da migliorare)
Fase 4: Inventario & Reporting - ☐ Consumo materiale per addon nelle vendite (usando conversioni unità) - ☐ Report margini che includono costo addon - ☐ Alert stock per materiali consumati come addon - ☐ Logica conversione: es. vendita 1 bicchiere (30ml) → scala 30ml dal stock bottiglia (750ml)

---

Decisioni architetturali prese

1. Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entità separate. Si collegano tramite tabelle ponte.
2. quantityValue su ProductAddonItem: definisce il “peso” dell’addon (es. caraffa = 3), diverso dalla quantità venduta.
3. maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
4. Soft delete: tutte le entità usano isActive invece di cancellazione fisica.
5. Multi-sede: ogni entità è scoped su storeId.
6. POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.
7. Frontend models: tutte le interfacce centralizzate in core/models/ per coerenza e riusabilità.
8. Unità referenziate: Material e ProductRecipe usano FK su Unit (unitId) invece di stringhe. Le conversioni tra unità sono gestite da UnitConversion.
9. Coerenza inventario: 1 materiale = 1 unità base. Le ricette consumano materiali in unità specifiche. Le conversioni permettono di tradurre tra unità di acquisto, stoccaggio e vendita.

---

Note per il debugging - Il backend gira su http://localhost:3000 - Il frontend admin su http://localhost:4200 - CORS già configurato per origini localhost:4200 e 127.0.0.1:4200 - Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema - Dopo modifiche allo schema: npx prisma migrate dev --name <nome> - POS Client DB SQLite: %LOCALAPPDATA%\POSClient.db (Windows) - Per ricreare DB SQLite: cancellare il file .db e riavviare l’app (usa EnsureCreated()) - Unità seed di default: Piece (pc), Gram (g), Milliliter (ml), Bottle (btl), Can (can), Box (box), Glass (glass) - POS Client log: %LOCALAPPDATA%\POS_Client_Log.txt

---

Come usare questo file nelle nuove chat Quando riapri una nuova sessione, fornisci questo link: https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md E digita: “Leggi il PROJECT_CONTEXT.md e aggiorniamo.”

---

Generato il 2026-06-25. Modifica e aggiorna liberamente.
