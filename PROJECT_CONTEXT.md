POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuita' tra sessioni di lavoro. Aggiorna la sezione "Ultimo aggiornamento" ogni volta che modifichi qualcosa.
Ultimo aggiornamento: 2026-06-28
Cosa e' stato fatto oggi (2026-06-28)
UI/UX — Toast Notifications, Menu Laterale, Ruoli, Collegamento Ruoli-Utenti
ToastService custom standalone (zero dipendenze esterne) con signal<Toast[]>()
ToastComponent — overlay globale in alto a destra, auto-close 3s/5s, animazione slide-in
LayoutComponent aggiornato: importa ToastComponent, menu con voce "Roles" (icona 🔐)
LayoutComponent SCSS: allineato al template HTML con classi .sidebar-header, .sidebar-nav, .nav-item, .sidebar-footer
AuthService: BehaviorSubject mantenuto (non toccato per compatibilita' POS Client C#)
RolesModule backend: CRUD ruoli con endpoint /roles/permissions (lista permessi raggruppati)
RolesComponent frontend: tabella ruoli con badge permessi, form modale con checkbox per categoria
Users backend DTO fix: create-user.dto.ts e update-user.dto.ts — roleId: number invece di role: UserRole (enum stringa)
Users backend Service: usa roleId diretto, soft delete, include role.permissions in userSelect
Users frontend: modello aggiornato con roleId: number, rimosso UserRole enum hardcoded
Users frontend Service: invia roleId (number) in create/update
Users frontend Component: carica ruoli dinamicamente da RolesService, dropdown nel form, toast notifications
Users frontend SCSS: tema coerente con badge ruolo/stato, form modale a 2 colonne
Cosa e' stato fatto ieri (2026-06-27)
Product Refactor — Ricette nestate, Addon price, Edit completo, Modifier Groups (2026-06-27)

- Backend DTO: ProductVariantDto con recipes[] interno (approccio B) — ricette nestate per variante
- Backend Service: createProduct() e update() con ricette nestate per variante (transazione Prisma)
- Backend: Modulo ModifierGroups dedicato (/modifier-groups endpoint) — spostato da ProductsController
- Backend: ModifierGroupsService con create/findAll/findOne/remove + include material nelle options
- Frontend: ProductComponent con form varianti + ricette nestate (ricette dentro ogni variante)
- Frontend: Addon form con price custom per ogni item (sovrascrive prezzo prodotto)
- Frontend: Edit prodotto completo (popola varianti, ricette, modifier, addon)
- Frontend: ModifierGroupsComponent con CRUD completo (form opzioni con material dropdown)
- Frontend: ModifierGroupsService per chiamare API /modifier-groups
- Fix: price su ProductAddonItemDto (create + update DTO)
- Fix: barcode/description rimossi da ProductUpdateInput (non esistono in schema Prisma)
- Fix: unit e material aggiunti a ModifierOption model frontend
- Fix: route modifier-groups spostata in modulo dedicato (risolve conflitto con pos/:companyId)
- Fix: DTO CreateModifierGroupDto campi numerici (priceAdjustment, quantityConsumed) + unit enum
  Categorie Gerarchiche (COMPLETATO)
  Schema Prisma: aggiunto parentId a ProductCategory con relazione ricorsiva (parent/children)
  Migration: npx prisma migrate dev --name add_category_parent
  Backend DTO: CreateProductCategoryDto / UpdateProductCategoryDto con parentId?: number
  Backend Service: ProductCategoriesService con:
  buildTree() — ritorna albero gerarchico (solo root + children annidati)
  Validazione anti-ciclo in update() (non puoi essere tuo proprio discendente)
  softDeleteRecursive() — disattiva categoria + tutti i figli
  Frontend Model: ProductCategory con parentId, children, parent
  Frontend Component: ProductCategoriesComponent con:
  Form con dropdown "Parent Category" indentato (visualizza gerarchia)
  Tabella con indentazione visuale (depth * 24px), icone 📁/📄, color dot
  getFlatCategories() per il dropdown (esclude se stessa e discendenti)
  Frontend Routes: aggiornato path da features/categories a features/product-categories
  Frontend Service: ProductCategoriesService usa ProductCategory da product.model.ts
  Prodotti — Fix DTO + Service (COMPLETATO)
  Backend DTO: CreateProductDto / UpdateProductDto — campi numerici (basePrice, taxRate, quantity, wastagePercent, priceAdjustment, quantityValue) da string a number con @IsNumber({ maxDecimalPlaces: X })
  Backend Service: ProductsService — rimossi tutti i parseFloat(), i campi sono gia' number
  Frontend: dropdown Category nel form prodotto usa getFlatCategories() con indentazione gerarchica
  Material — Fix completati (2026-06-27)
  Material model: allineato campo minStock (prima minStockLevel) al backend Prisma
  Materials component: tipi espliciti su tutti i signal(), DTO CreateMaterialDto locale per matchare class-validator backend (minStock: string, quantity: string, senza isActive sulle unita')
  Products component: tipi espliciti su tutti i signal(), RecipeUnit esplicito al posto di inferenza TypeScript never
  Fix build Angular: tutti i signal() tipizzati per evitare never[] in strict mode
  Auth & Seed (2026-06-27)
  main.ts: JwtAuthGuard globale con Reflector per supportare @Public()
  AuthController: @Public() aggiunto a setup e login (prima mancavano, bloccavano con 401)
  MaterialsService: fix minStock ternary (dto.minStock !== undefined invece di truthy check per evitare minStock="0" -> null)
  seed.service.ts: aggiunto resetSequences() che resetta tutte le sequenze autoincrement PostgreSQL a MAX(id) + 1
  AuthController: endpoint POST /auth/reset-sequences per reset manuale
  prisma/seed.ts: rimossi tutti gli ID espliciti su Material, MaterialUnit, Product, ProductRecipe. Usa findFirst + create/update invece di upsert con ID fissi. Chiama resetSequences() alla fine.
  Fix sequenze autoincrement (P2002): Prisma creava record con id esplicito nel seed, ma la sequenza PostgreSQL restava a 1. Quando l'app creava nuovi materiali, Prisma tentava id=1 -> conflitto Unique constraint failed on id.
  Wizard POS Client Setup — FIX completati (2026-06-26)
  Reconfigure dal POS Client ora chiama self-deactivate sul server (se online) prima di cancellare la config locale
  Backend setup() riattiva POS disattivato invece di bloccare con "already registered"
  Backend findAll() ritorna tutti i POS (attivi + inattivi) — frontend filtra con toggle
  Aggiunto endpoint POST /pos-clients/:id/self-deactivate (protetto da machine token) e PATCH /pos-clients/:id/reactivate
  Schema Prisma: aggiunto updatedAt a POSClient
  Seed: rimosso POSClient dal seed (viene creato solo dal wizard)
  POS Client App.xaml.cs: ShutdownMode = OnLastWindowClose (l'app si chiude correttamente)
  POS Client MainWindow.xaml.cs: btnReconfigure_Click verifica server online, disattiva via HttpClient, cleanup completo AppState, apri nuova MainWindow e chiude la vecchia
  Repository GitHub
  | Repo | URL | Tecnologia |
  |------|-----|------------|
  | Backend | https://github.com/LorisLancia/POS-Enterprise-Backend-NestJs.git | NestJS + Prisma + PostgreSQL |
  | Frontend Admin | https://github.com/LorisLancia/POS-Enterprise-Frontend-Angular.git | Angular v21.2.16 (Signals) |
  | POS Client | https://github.com/LorisLancia/POS.Client.git | C# WPF .NET + SQLite |
  Stack tecnologico
  | Layer | Tecnologia | Versione / Note |
  |-------|------------|-----------------|
  | Backend sede | NestJS | v11, TypeScript |
  | ORM | Prisma | v5.22.0, PostgreSQL |
  | DB Sede | PostgreSQL | 16+ JSONB per varianti/modifier flessibili, replication ready |
  | Frontend gestione | Angular | v21.2.16, Signals (@if/@for, signal(), computed()) |
  | POS Client | C# WPF | .NET MVVM, SQLite locale per offline |
  | Comunicazione | REST API + WebSocket | REST per bulk sync; WebSocket per real-time |
  | Auth | JWT + Passport | PIN-based per utenti POS; Machine token (10 anni) per POS Client |
  Pattern frontend (Angular)
  REGOLA FERMA: Tutta la reattivita' UI usa Angular Signals (signal(), computed()). MAI usare proprieta' plain o *ngIf per stato che deve aggiornare la UI. Usare sempre @if / @for (control flow) nei template.
  REGOLA FERMA: Tutti i signal([]) devono avere tipo esplicito: signal<T[]>([]) invece di signal([]) per evitare never[] in TypeScript strict mode.
  Struttura Frontend (models / services)
  Tutte le interfacce sono centralizzate in core/models/:
- company.model.ts -> Company, CreateCompanyRequest, UpdateCompanyRequest
- warehouse.model.ts -> Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest
- pos-client.model.ts -> POSClient, CreatePOSClientRequest, UpdatePOSClientRequest
- auth.model.ts -> AuthUser, LoginResponse
- user.model.ts -> User, Role, CreateUserDto, UpdateUserDto (roleId: number, nessun UserRole enum)
- sale.model.ts -> Sale, SaleItem, Payment, SalesReport
- material.model.ts -> Material, MaterialUnit, InventoryItem, InventoryTransactionDto
- unit.model.ts -> Unit
- unit-conversion.model.ts -> UnitConversion
- product.model.ts -> Product, ProductVariant, ProductRecipe, ModifierGroup, ModifierOption, ProductModifier, ProductAddon, ProductAddonItem, ProductCategory
- product-addon.model.ts -> CreateProductAddonDto, UpdateProductAddonDto, ProductAddonItemDto
- role.model.ts -> Role, PermissionGroup, CreateRoleDto, UpdateRoleDto
- toast.model.ts -> Toast (id, message, type, title?)
  Database - Stato entita'
  | Entita' | Stato | Note |
  |---------|-------|------|
  | Company | ✅ | Multi-sede base. Campi anagrafici completi per scontrini/fatture |
  | Warehouse | ✅ | Magazzini per company. Rimosso type, aggiunti address, phone |
  | POSClient | ✅ | FK companyId + warehouseId. updatedAt aggiunto 2026-06-26. Incasso separato per cassa |
  | Role / User / UserSession | ✅ | RBAC con permissions JSON. companyId al posto di storeId. Users DTO usa roleId: number (2026-06-28) |
  | Unit | ✅ | Unita' di misura referenziate (piece, volume, weight, container) |
  | UnitConversion | ✅ | Conversioni tra unita' |
  | Material | ✅ | FK su Unit (unitId), categorie gestite via input. Multi-unita' con MaterialUnit. minStock (Decimal) |
  | Product | ✅ | basePrice, taxRate, trackInventory, allowDecimalQty. DTO numeri (non stringhe) 2026-06-27 |
  | ProductCategory | ✅ | Gerarchico con parentId/children 2026-06-27 |
  | ProductVariant | ✅ | Small, Large, priceAdjustment. Ricette nestate dentro variante (approccio B) |
  | ProductRecipe | ✅ | BOM con FK su Unit (unitId), variantId opzionale. Nestato dentro variante nel DTO |
  | ModifierGroup | ✅ | selectionType: single/multiple, min/max select. Modulo dedicato /modifier-groups |
  | ModifierOption | ✅ | priceAdjustment, materialId, quantityConsumed, unit. Include material in risposta |
  | ProductModifier | ✅ | Collega Product <-> ModifierGroup (isRequired, sortOrder) |
  | Inventory / InventoryTransaction | ✅ | Traccia giacenza e movimenti |
  | Supplier / PurchaseOrder / POItem | ✅ | Ordini acquisto |
  | Shift / CashMovement | ✅ | Turni cassa. Legati a POSClient (incasso separato) |
  | Sale / SaleItem / SaleItemModifier / Payment | ✅ | Vendite complete |
  | SyncMetadata | ✅ | Per sync POS offline |
  | ProductAddon | ✅ | Tabella ponte: Product -> Addon (maxQuantity, sortOrder) |
  | ProductAddonItem | ✅ | Lista prodotti-addon con quantityValue, price (custom) |
  | SaleItemAddon | ✅ | Traccia addon selezionati in una vendita |
  | Store | ❌ | ELIMINATA — Sostituita da Company direttamente |
  Schema Prisma completo (attuale)
  Vedere prisma/schema.prisma nel repository.
  Modifiche recenti (2026-06-28):
- ToastService custom standalone (zero dipendenze esterne)
- ToastComponent globale nel Layout
- RolesModule backend con CRUD e endpoint /roles/permissions
- RolesComponent frontend con tabella, form modale, checkbox permessi per categoria
- Users backend DTO: roleId: number (non piu' enum stringa)
- Users backend Service: usa roleId diretto, soft delete, include role.permissions
- Users frontend: modello con roleId: number, rimosso UserRole enum
- Users frontend: dropdown ruoli dinamico da RolesService
- Users frontend: toast notifications, form a 2 colonne, badge ruolo/stato
  Modifiche recenti (2026-06-27):
- ProductCategory: aggiunto parentId con relazione ricorsiva (parent/children)
- Material: multi-unita' con MaterialUnit (tabella ponte). minStock come Decimal.
- Product DTO: campi numerici (basePrice, taxRate, quantity, etc.) invece di stringhe
- ProductRecipe: nestato dentro ProductVariantDto (approccio B)
- ProductAddonItem: aggiunto price (Decimal?) per prezzo custom
- ModifierGroup: modulo dedicato con endpoint /modifier-groups
- ModifierOption: aggiunto unit (StandardUnit)
- Seed: rimossi ID espliciti, aggiunto resetSequences()
- Backend: JwtAuthGuard globale, @Public() su login/setup
  Modifiche recenti (2026-06-26):
- POSClient — aggiunto updatedAt DateTime @updatedAt
- Seed — rimosso POSClient dal seed (evita conflitto autoincrement)
- setup() — riattiva POS disattivato invece di bloccare
  Backend - Moduli esistenti
  src/
  ├── app.module.ts
  ├── main.ts # JwtAuthGuard globale (2026-06-27)
  ├── prisma/
  │ └── schema.prisma
  ├── companies/
  ├── warehouses/
  ├── pos-clients/
  │ ├── pos-clients.service.ts # CRUD + setup() + reactivate() + self-deactivate logic
  │ ├── pos-clients.controller.ts # + PATCH :id/reactivate, + POST :id/self-deactivate
  │ ├── pos-clients.module.ts
  │ └── dto/
  ├── products/
  │ ├── products.service.ts # createProduct() con ricette nestate, update() completo
  │ ├── products.controller.ts # CRUD prodotto, rimosso modifier-groups (spostato)
  │ └── dto/
  │ ├── create-product.dto.ts # ProductVariantDto con recipes[], numeri
  │ └── update-product.dto.ts # DTO esplicito con id su variante per upsert
  ├── modifier-groups/ # NUOVO MODULO (2026-06-27)
  │ ├── modifier-groups.service.ts
  │ ├── modifier-groups.controller.ts
  │ ├── modifier-groups.module.ts
  │ └── dto/
  │ ├── create-modifier-group.dto.ts # priceAdjustment/quantityConsumed numeri + unit
  │ └── assign-modifier.dto.ts
  ├── product-addon/
  │ ├── product-addon.service.ts
  │ ├── product-addon.controller.ts
  │ └── dto/
  │ ├── create-product-addon.dto.ts
  │ └── update-product-addon.dto.ts
  ├── product-categories/
  │ ├── product-categories.service.ts # Albero gerarchico + anti-ciclo (2026-06-27)
  │ ├── product-categories.controller.ts
  │ └── dto/
  │ ├── create-product-category.dto.ts # + parentId (2026-06-27)
  │ └── update-product-category.dto.ts # + parentId (2026-06-27)
  ├── units/
  ├── unit-conversions/
  ├── materials/
  │ ├── materials.service.ts # Fix minStock ternary (2026-06-27)
  │ ├── materials.controller.ts
  │ └── dto/
  │ ├── create-material.dto.ts # minStock: string, quantity: string
  │ └── update-material.dto.ts
  ├── sales/
  ├── auth/
  │ ├── auth.service.ts
  │ ├── auth.controller.ts # @Public() su setup/login (2026-06-27)
  │ ├── seed.service.ts # + resetSequences() (2026-06-27)
  │ └── dto/
  ├── users/ # FIX 2026-06-28: roleId: number, companyId, soft delete
  │ ├── users.service.ts
  │ ├── users.controller.ts
  │ └── dto/
  │ ├── create-user.dto.ts # roleId: number, companyId: number
  │ └── update-user.dto.ts # roleId?: number, companyId?: number
  └── roles/ # NUOVO MODULO (2026-06-28)
  ├── roles.service.ts # CRUD + getPermissions()
  ├── roles.controller.ts # + GET /roles/permissions
  ├── roles.module.ts
  └── dto/
  ├── create-role.dto.ts
  └── update-role.dto.ts
  Endpoint API
  Auth
- POST /auth/setup — seed DB + reset sequenze (PUBLIC)
- POST /auth/login — login cassiere (PIN) (PUBLIC)
- POST /auth/admin-companies — WIZARD: admin PIN -> lista company gestibili (PUBLIC)
- POST /auth/reset-sequences — resetta sequenze autoincrement (PUBLIC)
- GET /auth/me — profilo utente logato
- GET /auth/health — health check (PUBLIC)
- POST /auth/machine-token — genera machine token (hardwareId + posClientId)
  Company
- GET /companies — lista sedi
- POST /companies — crea sede
- GET /companies/:id — dettaglio sede (con warehouses e posClients)
- PATCH /companies/:id — aggiorna sede
- DELETE /companies/:id — soft delete sede
  Warehouse
- GET /warehouses?companyId=X — lista magazzini per sede
- POST /warehouses — crea magazzino
- GET /warehouses/:id — dettaglio magazzino (con inventory e posClients)
- PATCH /warehouses/:id — aggiorna magazzino
- DELETE /warehouses/:id — soft delete magazzino
  POS Client
- GET /pos-clients?companyId=X — lista tutti i POS per sede (attivi + inattivi)
- POST /pos-clients — registra POS Client (admin only)
- POST /pos-clients/setup — WIZARD: admin PIN + dati POS -> crea/riattiva POS + machine token (PUBLIC)
- GET /pos-clients/:id — dettaglio POS (con ultimi turni)
- PATCH /pos-clients/:id — aggiorna POS
- DELETE /pos-clients/:id — soft delete POS (setta isActive=false)
- PATCH /pos-clients/:id/reactivate — riattiva POS disattivato
- POST /pos-clients/:id/self-deactivate — il POS stesso si disattiva con il proprio machine token
- POST /pos-clients/:id/sync — registra sync timestamp
  Material
- GET /materials — lista materiali per company (inventory:read)
- POST /materials — crea materiale con unita' multiple (inventory:create)
- GET /materials/:id — dettaglio materiale
- PATCH /materials/:id — aggiorna materiale (inventory:update)
- DELETE /materials/:id — soft delete materiale (inventory:delete)
  Product Category (Gerarchico)
- GET /product-categories — lista categorie albero per company (product:read)
- POST /product-categories — crea categoria con parentId (product:create)
- GET /product-categories/:id — dettaglio categoria (con children e parent)
- PATCH /product-categories/:id — aggiorna categoria (anti-ciclo) (product:update)
- DELETE /product-categories/:id — soft delete ricorsivo categoria + figli (product:delete)
  Product
- GET /products — lista prodotti per company
- POST /products — crea prodotto con varianti (ricette nestate), addon, modifierGroupIds
- GET /products/:id — dettaglio prodotto
- PATCH /products/:id — aggiorna prodotto (upsert varianti/ricette/addon/modifier)
- DELETE /products/:id — soft delete prodotto
  Modifier Groups (NUOVO — modulo dedicato)
- GET /modifier-groups — lista gruppi per company (product:read)
- POST /modifier-groups — crea gruppo con opzioni (product:create)
- GET /modifier-groups/:id — dettaglio gruppo (con options e material)
- DELETE /modifier-groups/:id — soft delete gruppo (product:delete)
  Product Addon
- POST /product-addons — crea addon group
- GET /product-addons/product/:productId — lista addon di un prodotto
- GET /product-addons/:id — dettaglio addon
- PATCH /product-addons/:id — aggiorna addon
- DELETE /product-addons/:id — soft delete addon
  Units
- GET /units — lista unita' per company
- POST /units — crea unita'
- PATCH /units/:id — aggiorna unita'
- DELETE /units/:id — soft delete unita'
  Unit Conversions
- GET /unit-conversions — lista conversioni per company
- POST /unit-conversions — crea conversione (fromUnitId, toUnitId, factor)
- PATCH /unit-conversions/:id — aggiorna conversione
- DELETE /unit-conversions/:id — soft delete conversione
  Roles (NUOVO — 2026-06-28)
- GET /roles — lista ruoli attivi per company
- GET /roles/permissions — lista permessi disponibili raggruppati per categoria
- GET /roles/:id — dettaglio ruolo
- POST /roles — crea ruolo con permessi
- PATCH /roles/:id — aggiorna ruolo
- DELETE /roles/:id — soft delete ruolo (blocca se ha utenti attivi)
  Users (AGGIORNATO — 2026-06-28)
- GET /users — lista utenti (con role e permissions)
- GET /users/:id — dettaglio utente
- POST /users — crea utente (roleId: number, companyId: number)
- PATCH /users/:id — aggiorna utente (roleId?: number)
- DELETE /users/:id — soft delete utente
  Sync POS
- GET /products/pos/:companyId — ProductsService.getProductsForPOS() — restituisce prodotti attivi con: category, variants, recipes (con unit), modifiers, addons (con items)
  POS Client (C# WPF) — Wizard Setup 3-Step (IMPLEMENTATO 2026-06-26, FIX 2026-06-26)
  Flusso wizard:
  Step 1: Inserisci URL server -> GET /auth/health (verifica connessione)
  Step 2: Admin username + PIN -> POST /auth/admin-companies -> ritorna lista company
  Step 3: Dropdown Company (auto-seleziona se una sola), Dropdown Warehouse, Register Name, Location, Hardware ID (auto-generato)
  POST /pos-clients/setup con tutti i dati -> ritorna: posClientId, machineToken (10 anni), companyId, warehouseId
  Salva SetupConfig in SQLite (AppConfig key="pos_setup")
  Popola AppState -> avvia MainWindow
  Reconfigure (FIX 2026-06-26):
  Clicca bottone "Reconfigure" in MainWindow
  Verifica server online (ConnectionService.IsServerOnlineAsync())
  Se online: chiama POST /pos-clients/{id}/self-deactivate con machine token
  Se offline: avvisa l'utente, procede con cleanup locale
  ConfigService.ClearSetupConfig() + ClearToken()
  Reset completo AppState (tutti i campi)
  Apri SetupWizardWindow (modale)
  Se wizard completato: carica nuova config, apri nuova MainWindow, chiudi la vecchia
  Se wizard annullato: this.Close() -> app si chiude (ShutdownMode.OnLastWindowClose)
  Cosa e' fatto ✅
  Schema Prisma completo per tutte le entita' core
  Eliminata tabella Store, tutte le FK storeId -> companyId
  Company arricchita con campi anagrafici per scontrini/fatture
  Warehouse senza type, con address e phone
  POSClient con warehouseId + updatedAt (2026-06-26)
  Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user)
  CRUD prodotti, varianti, ricette, modifier groups, modifier options
  Assegnazione modifier ai prodotti (ProductModifier)
  Nuove tabelle addon: ProductAddon, ProductAddonItem, SaleItemAddon
  Nuove tabelle unita': Unit, UnitConversion
  Material.unit (string) -> Material.unitId (FK -> Unit)
  ProductRecipe.unit (string) -> ProductRecipe.unitId (FK -> Unit)
  ProductAddonService e ProductAddonController con CRUD completo
  UnitsService e UnitsController con CRUD completo
  UnitConversionsService e UnitConversionsController con CRUD completo
  ProductCategoriesService e ProductCategoriesController con CRUD completo
  ProductCategory gerarchico con parentId/children (2026-06-27)
  ProductsService aggiornato per gestire addon inline nel create/update product
  ProductsService aggiornato per includere unit nelle ricette
  MaterialsService aggiornato per includere unit nei materiali
  getProductsForPOS aggiornato per includere addon e unit nella risposta sync
  Frontend: ProductAddonManagerComponent con Signals
  Frontend: ProductAddonService per chiamare API addon
  Frontend: Pagina /categories con CRUD completo e albero gerarchico (2026-06-27)
  Frontend: Pagina /materials con CRUD completo (dropdown Unit, multi-unita', minStock)
  Frontend: Pagina /units con CRUD completo
  Frontend: Pagina /unit-conversions con CRUD completo
  Frontend: Pagina /modifier-groups con CRUD completo (form opzioni con material dropdown) (2026-06-27)
  Frontend: Form prodotto completo in creazione con dropdown categorie gerarchico (2026-06-27)
  Frontend: Form prodotto edit completo con varianti/ricette/modifier/addon (2026-06-27)
  Frontend: Addon con price custom per item (2026-06-27)
  Frontend: Ricette nestate dentro varianti nel form (2026-06-27)
  Frontend: Allineamento modello Product (price -> basePrice, category -> categoryId)
  Frontend: Tutti i modelli spostati in core/models/
  Frontend: Tutti i service puliti e allineati ai modelli
  POS Client: AddonSelectionWindow (UI per selezionare addon con quantita')
  POS Client: CashierWindow aggiornato (flusso addon -> modifier -> variant)
  POS Client: OfflineQueueService aggiornato (invia addon al backend)
  POS Client: POSDbContext aggiornato con relazioni Product->Addon->Items, SaleItem->Addon
  Auth JWT + PIN per utenti POS
  Gestione inventario, acquisti, turni, vendite
  Endpoint sync per POS (getProductsForPOS)
  Frontend admin con routing base e guard auth
  POS Client: Wizard Setup 3-Step implementato (2026-06-26)
  POS Client: Configurazione persistente in SQLite (SetupConfig)
  POS Client: Machine token (10 anni) per sync automatico
  POS Client: Riconfigurazione da UI con self-deactivate server-side (2026-06-26)
  POS Client: ShutdownMode.OnLastWindowClose — app si chiude correttamente (2026-06-26)
  Backend: setup() riattiva POS disattivato (2026-06-26)
  Backend: findAll() ritorna tutti i POS (attivi + inattivi) (2026-06-26)
  Backend: endpoint reactivate e self-deactivate (2026-06-26)
  Seed: rimosso POSClient dal seed (2026-06-26)
  Backend: JwtAuthGuard globale in main.ts (2026-06-27)
  Backend: @Public() su login/setup in AuthController (2026-06-27)
  Backend: MaterialsService fix minStock ternary (2026-06-27)
  Backend: seed.service.ts + resetSequences() (2026-06-27)
  Backend: prisma/seed.ts senza ID espliciti + resetSequences() (2026-06-27)
  Backend: Product DTO numeri invece di stringhe (2026-06-27)
  Backend: Modulo ModifierGroups dedicato con endpoint /modifier-groups (2026-06-27)
  Backend: ModifierOption con unit (StandardUnit) e include material (2026-06-27)
  Frontend: Material model allineato a minStock (2026-06-27)
  Frontend: Products/Materials component con tipi espliciti signal (2026-06-27)
  Frontend: Categorie gerarchiche con albero visuale (2026-06-27)
  Frontend: ModifierOption model con unit e material (2026-06-27)
  Frontend: ToastService custom standalone (zero dipendenze) (2026-06-28)
  Frontend: ToastComponent globale nel Layout (2026-06-28)
  Backend: RolesModule con CRUD + GET /roles/permissions (2026-06-28)
  Frontend: RolesComponent con tabella, form modale, checkbox permessi (2026-06-28)
  Backend: Users DTO fix — roleId: number invece di role: UserRole enum (2026-06-28)
  Backend: UsersService — usa roleId diretto, soft delete, include role.permissions (2026-06-28)
  Frontend: UsersComponent — dropdown ruoli dinamico da RolesService, form a 2 colonne (2026-06-28)
  Frontend: Users model — roleId: number, rimosso UserRole enum hardcoded (2026-06-28)
  Cosa manca / Roadmap 🚧
  Fase 1: Refactor architettura (IN CORSO)
  ✅ Schema Prisma: eliminata Store, arricchita Company, aggiornate FK
  ✅ Backend: CompaniesModule, WarehousesModule, PosClientsModule
  ✅ Frontend: CompanyComponent, WarehouseComponent, PosClientComponent
  ✅ POSClient.updatedAt aggiunto (2026-06-26)
  ✅ Material multi-unita' con MaterialUnit (2026-06-27)
  ✅ ProductCategory gerarchico con parentId/children (2026-06-27)
  ✅ Product DTO numeri (2026-06-27)
  ✅ Modulo ModifierGroups dedicato (2026-06-27)
  ✅ Refactor storeId -> companyId (completato, DB ricreato)
  ✅ Migration refactor_remove_store (completato, DB ricreato)
  ☐ Aggiornare POS Client C#: modelli LocalCompany, LocalWarehouse, LocalPOSClient
  ☐ Aggiornare SyncService POS per scaricare company/warehouse/posclient
  Fase 2: POS Client Wizard Setup ✅ COMPLETATA (2026-06-26)
  ✅ UI Wizard 3-Step (URL -> Admin -> Config)
  ✅ Endpoint backend: POST /auth/admin-companies
  ✅ Endpoint backend: POST /pos-clients/setup (con riattivazione)
  ✅ Verifica admin PIN + ruolo
  ✅ Super admin vs admin normale (company access)
  ✅ Machine token JWT (10 anni)
  ✅ Configurazione persistente SQLite
  ✅ Riconfigurazione da UI con server-side deactivation
  ✅ ShutdownMode.OnLastWindowClose
  ☐ Test end-to-end con piu' company
  ☐ Gestione errore se server non raggiungibile durante sync
  Fase 3: Inventario & Reporting
  ☐ Consumo materiale per modifier nelle vendite (ModifierOption.quantityConsumed -> scala inventario)
  ☐ Consumo materiale per addon nelle vendite (usando conversioni unita')
  ☐ Report margini che includono costo addon
  ☐ Alert stock per materiali consumati come addon o modifier
  ☐ Logica conversione: es. vendita 1 bicchiere (30ml) -> scala 30ml dal stock bottiglia (750ml)
  ☐ Report per sede (company) con dati anagrafici su scontrini
  ☐ Report aggregati multi-sede (cloud dashboard)
  Fase 4: Sync & Offline
  ☐ Sync dati sede (company, warehouse) nel POS Client
  ☐ Sync automatico all'avvio
  ☐ Gestione offline completa (vendite, sync, retry)
  ☐ WebSocket per notifiche real-time
  Fase 5: UI/UX Polish
  ☐ Layout responsive Materials, Products, Categories, ModifierGroups
  ☐ Tema coerente su tutte le pagine
  ✅ Toast notifications per successo/errore (2026-06-28)
  ☐ Loading skeletons
  ✅ Form prodotto edit con varianti/ricette/modifier/addon esistenti — COMPLETATO (2026-06-27)
  ☐ Visualizzazione prodotti per categoria nel POS touch
  Fase 6: RBAC & Sicurezza (IN CORSO — 2026-06-28)
  ✅ Backend: RolesModule con CRUD permessi
  ✅ Backend: Users DTO usa roleId: number
  ✅ Frontend: RolesComponent per gestire ruoli
  ✅ Frontend: UsersComponent con dropdown ruoli dinamico
  ☐ Menu laterale filtrato per permessi utente
  ☐ Direttiva _appHasPermission per nascondere bottoni/azioni
  ☐ Route guard per bloccare accesso a pagine senza permesso
  ☐ POS Client: PermissionService C# per verificare permessi offline
  ☐ POS Client: Richiesta autorizzazione PIN per sconti/rimborsi
  Decisioni architetturali prese
  Company = Sede fisica: Ogni sede (Phuket, Bangkok, Chiang Mai) e' una Company con dati anagrafici completi per scontrini e fatture.
  No Store intermedia: Eliminata la tabella Store. Company gestisce direttamente warehouses, users, products, etc.
  Warehouse senza type: Rimosso il campo type perche' il nome gia' descrive la funzione ("Bar Principale", "Shisha Lounge", "Ufficio"). Ogni magazzino puo' ricevere ordini propri.
  POSClient -> Warehouse: Ogni cassa e' associata a un magazzino. Incasso separato per POS Client (non aggregato a livello warehouse).
  Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entita' separate. Si collegano tramite tabelle ponte.
  quantityValue su ProductAddonItem: definisce il "peso" dell'addon (es. caraffa = 3), diverso dalla quantita' venduta.
  maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
  Modifier = Opzione che modifica il prodotto: es. "Scegli il mixer" con opzioni Coca/Sprite/Tonic. Ogni opzione puo' consumare materiale (quantityConsumed) e avere priceAdjustment.
  Ricette nestate (approccio B): ProductRecipe e' nestato dentro ProductVariantDto. Ogni variante "porta" le proprie ricette. Il backend crea la variante, ottiene l'ID, poi crea le ricette con quel variantId.
  Addon price custom: ProductAddonItem ha campo price opzionale. Se valorizzato, sovrascrive il prezzo del prodotto-addon (utile per "gratis" o prezzi promozionali).
  Soft delete: tutte le entita' usano isActive invece di cancellazione fisica.
  Multi-sede: ogni entita' e' scoped su companyId.
  POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.
  Frontend models: tutte le interfacce centralizzate in core/models/ per coerenza e riusabilita'.
  Unita' referenziate: Material e ProductRecipe usano FK su Unit (unitId) invece di stringhe. Le conversioni tra unita' sono gestite da UnitConversion.
  Coerenza inventario: 1 materiale = 1 unita' base. Le ricette consumano materiali in unita' specifiche. Le conversioni permettono di tradurre tra unita' di acquisto, stoccaggio e vendita.
  Wizard Setup POS: approccio endpoint unico (POST /pos-clients/setup) per semplicita' e sicurezza. Admin PIN verificato lato server, machine token generato automaticamente.
  Reconfigure: il POS si disattiva da solo sul server (self-deactivate) usando il proprio machine token, poi cancella la config locale e riparte il wizard. Se il server e' offline, procede comunque con il cleanup locale.
  Material multi-unita': MaterialUnit tabella ponte con unit (enum), quantity, isDefault, isPurchaseUnit, isSaleUnit. Permette di definire "1 Piece = 1", "750 ML = 1 bottiglia", "6 Pack = 1 confezione" per lo stesso materiale.
  Categorie gerarchiche: ProductCategory con parentId e relazione ricorsiva. Il backend ritorna albero gerarchico, il frontend visualizza con indentazione. Il form prodotto usa dropdown indentato per selezionare la categoria foglia.
  RBAC: Role.permissions e' un JSON array di stringhe (es. ["product:read", "sale:create", "_"]). Il backend include permissions nel JWT. Il frontend puo' usare hasPermission() per filtrare UI. Il POS Client riceve permissions dal JWT al login e li salva in SQLite per uso offline.
  Toast custom: ToastService standalone con signal<Toast[]>(), zero dipendenze esterne. ToastComponent globale nel Layout. Auto-close 3s (success/info) o 5s (error/warning).
  Note per il debugging
  Il backend gira su http://localhost:3000
  Il frontend admin su http://localhost:4200
  CORS gia' configurato per origini localhost:4200 e 127.0.0.1:4200
  Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema
  Dopo modifiche allo schema: npx prisma migrate dev --name
  Per pulire DB e re-seedare: npx prisma migrate reset --force poi POST /auth/setup
  Per resettare solo sequenze: POST /auth/reset-sequences
  POS Client DB SQLite: %LOCALAPPDATA%\POSClient.db (Windows)
  Per ricreare DB SQLite: cancellare il file .db e riavviare l'app (usa EnsureCreated())
  Unita' seed di default: Piece (pc), Gram (g), Milliliter (ml), Bottle (btl), Can (can), Box (box), Glass (glass)
  POS Client log: %LOCALAPPDATA%\POS_Client_Log.txt
  POS Client config: %LOCALAPPDATA%\POS.Client\config.json (DEPRECATO, ora in SQLite AppConfig)
  Seed admin: username admin, PIN 123456
  Come usare questo file nelle nuove chat
  Quando riapri una nuova sessione, fornisci questo link:
  https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md
  E digita: "Leggi il PROJECT_CONTEXT.md e aggiorniamo."
  Generato il 2026-06-28. Modifica e aggiorna liberamente.
