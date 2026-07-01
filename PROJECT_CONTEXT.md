POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuita' tra sessioni di lavoro. Aggiorna la sezione "Ultimo aggiornamento" ogni volta che modifichi qualcosa.

Ultimo aggiornamento: 2026-07-01

Cosa e' stato fatto oggi (2026-07-01)
Addon Groups: separati da Products come modulo dedicato (/addon-groups endpoint)
Schema Prisma: nuovi modelli AddonGroup, AddonGroupItem, ProductAddon con groupId
ProductsService: create/update usano addonGroupIds[] invece di addon inline
Frontend: ProductsComponent carica addon-groups da API dedicata
Frontend: LayoutComponent — aggiunta voce "Addon Groups" nel menu Catalog (icona fa-puzzle-piece)
Migration: npx prisma migrate reset --force per allineare DB (nuove tabelle addon_groups, addon_group_items, colonna group_id su product_addons)
Repository GitHub
| Repo | URL | Branch | Tecnologia |
|------|-----|--------|------------|
| Backend | https://github.com/LorisLancia/POS-Enterprise-Backend-NestJs.git | main | NestJS + Prisma + PostgreSQL |
| Frontend Admin | https://github.com/LorisLancia/POS-Enterprise-Frontend-Angular.git | main | Angular v21.2.16 (Signals) |
| POS Client | https://github.com/LorisLancia/POS.Client.git | main | C# WPF .NET + SQLite |

Stack tecnologico
| Layer | Tecnologia | Versione / Note |
|-------|-----------|-----------------|
| Backend sede | NestJS | v11, TypeScript |
| ORM | Prisma | v5.22.0, PostgreSQL |
| DB Sede | PostgreSQL | 16+ JSONB per varianti/modifier flessibili, replication ready |
| Frontend gestione | Angular | v21.2.16, Signals (@if/@for, signal(), computed()) |
| POS Client | C# WPF | .NET MVVM, SQLite locale per offline |
| Comunicazione | REST API + WebSocket | REST per bulk sync; WebSocket per real-time |
| Auth | JWT + Passport | PIN-based per utenti POS; Machine token (10 anni) per POS Client |

Pattern frontend (Angular)
REGOLA FERMA: Tutta la reattivita' UI usa Angular Signals (signal(), computed()). MAI usare proprieta' plain o \*ngIf per stato che deve aggiornare la UI. Usare sempre @if / @for (control flow) nei template.
REGOLA FERMA: Tutti i signal([]) devono avere tipo esplicito: signal<tipo[]>([]) invece di signal([]) per evitare never[] in TypeScript strict mode.
REGOLA FERMA: ngModel su signal NON usa [(ngModel)]. Usare [ngModel]="signal()" + (ngModelChange)="signal.set($event)".
REGOLA FERMA: Selettore categorie gerarchiche usa selectedCategoryPath: number[] signal + categoryLevels computed per N livelli dinamici.
REGOLA FERMA: Menu laterale usa oggetti MenuGroup / MenuItem con icon: string (classe Font Awesome, es. 'fa-puzzle-piece'), NON emoji.

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
- addon-group.model.ts -> AddonGroup, AddonGroupItem, CreateAddonGroupDto, UpdateAddonGroupDto

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
| AddonGroup | ✅ | NUOVO 2026-07-01: Gruppo addon separato da Product, companyId, maxQuantity, sortOrder |
| AddonGroupItem | ✅ | NUOVO 2026-07-01: Item dentro gruppo, addonProductId, quantityValue, price, sortOrder |
| ProductAddon | ✅ | NUOVO 2026-07-01: Tabella ponte Product <-> AddonGroup (groupId, sortOrder, isActive) |
| Store | ❌ | ELIMINATA — Sostituita da Company direttamente |

Schema Prisma completo (attuale)
Vedere prisma/schema.prisma nel repository.

Modifiche recenti (2026-07-01):

- Addon Groups: separati da Products come modulo dedicato (/addon-groups endpoint)
- Schema Prisma: nuovi modelli AddonGroup, AddonGroupItem, ProductAddon con groupId
- ProductsService: create/update usano addonGroupIds[] invece di addon inline
- Frontend: ProductsComponent carica addon-groups da API dedicata
- Frontend: LayoutComponent — aggiunta voce "Addon Groups" nel menu Catalog (icona fa-puzzle-piece)
- Migration: npx prisma migrate reset --force per allineare DB (nuove tabelle addon_groups, addon_group_items, colonna group_id su product_addons)

Modifiche recenti (2026-06-28):

- Design System SCSS unificato Company/Warehouse/POS Client
- WarehousesService.findAll(): rimosso filtro isActive (ritorna attivi + inattivi)
- Frontend: showInactive + filteredCompanies/filteredWarehouses/filteredPOSClients
- Fix ngModel su signal per select e checkbox
- ToastService custom standalone (zero dipendenze esterne)
- ToastComponent globale nel Layout
- RolesModule backend con CRUD e endpoint /roles/permissions
- RolesComponent frontend con tabella, form modale, checkbox permessi per categoria
- Users backend DTO: roleId: number (non piu' enum stringa)
- Users backend Service: usa roleId diretto, soft delete, include role.permissions
- Users frontend: modello con roleId: number, rimosso UserRole enum
- Users frontend: dropdown ruoli dinamico da RolesService
- Users frontend: toast notifications, form a 2 colonne, badge ruolo/stato
- Backend: CompaniesService.update() filtra campi relazioni (warehouses, posClients, createdAt, updatedAt)
- Backend: WarehousesService.update() filtra campi relazioni (company, posClients, inventory, createdAt, updatedAt)
- Frontend: Reactivate Company/Warehouse invia solo { isActive: true }
- Frontend: Reactivate POS Client usa endpoint dedicato PATCH /pos-clients/:id/reactivate
- Frontend: Product Categories Design System SCSS, tabella gerarchica, toggle inactive, ConfirmDialog
- Frontend: Products Component refactor — formData signal, selettore categorie cascata dinamico N livelli
- Frontend: Products field wrapper con label, card sections, btn-icon-danger, btn-small dashed
- Frontend: Products getCategoryHierarchy() percorso completo, findCategoryById() ricorsivo

Modifiche recenti (2026-06-27):

- ProductCategory: aggiunto parentId con relazione ricorsiva (parent/children)
- Material: multi-unita' con MaterialUnit (tabella ponte). minStock come Decimal.
- Product DTO: campi numerici (basePrice, taxRate, quantity, etc.) invece di stringhe
- ProductRecipe: nestato dentro ProductVariantDto (approccio B)
- ProductAddonItem: aggiunto price (Decimal?) per prezzo custom
- ModifierGroup: modulo dedicato con endpoint /modifier-groups
- ModifierOption: aggiunto unit (StandardUnit) e include material
- Seed: rimossi ID espliciti, aggiunto resetSequences()
- Backend: JwtAuthGuard globale, @Public() su login/setup
- Backend: MaterialsService fix minStock ternary
- Backend: seed.service.ts + resetSequences()

Modifiche recenti (2026-06-26):

- POSClient — aggiunto updatedAt DateTime @updatedAt
- Seed — rimosso POSClient dal seed (evita conflitto autoincrement)
- setup() — riattiva POS disattivato invece di bloccare
- Backend: endpoint reactivate e self-deactivate
- POS Client: Wizard Setup 3-Step implementato
- POS Client: Configurazione persistente SQLite
- POS Client: Machine token JWT (10 anni)
- POS Client: Riconfigurazione da UI con server-side deactivation
- POS Client: ShutdownMode.OnLastWindowClose

Backend - Moduli esistenti
src/
├── app.module.ts
├── main.ts # JwtAuthGuard globale (2026-06-27)
├── prisma/
│ └── schema.prisma
├── companies/
├── warehouses/
│ ├── warehouses.service.ts # findAll() ritorna attivi + inattivi (2026-06-28)
│ ├── warehouses.controller.ts
│ └── dto/
├── pos-clients/
│ ├── pos-clients.service.ts # CRUD + setup() + reactivate() + self-deactivate logic
│ ├── pos-clients.controller.ts # + PATCH :id/reactivate, + POST :id/self-deactivate
│ ├── pos-clients.module.ts
│ └── dto/
├── products/
│ ├── products.service.ts # createProduct() con ricette nestate, update() completo, addonGroupIds (2026-07-01)
│ ├── products.controller.ts # CRUD prodotto
│ └── dto/
│ ├── create-product.dto.ts # ProductVariantDto con recipes[], numeri, addonGroupIds[]
│ └── update-product.dto.ts # DTO esplicito con id su variante per upsert
├── modifier-groups/ # NUOVO MODULO (2026-06-27)
│ ├── modifier-groups.service.ts
│ ├── modifier-groups.controller.ts
│ ├── modifier-groups.module.ts
│ └── dto/
│ ├── create-modifier-group.dto.ts # priceAdjustment/quantityConsumed numeri + unit
│ └── assign-modifier.dto.ts
├── addon-groups/ # NUOVO MODULO (2026-07-01)
│ ├── addon-groups.service.ts
│ ├── addon-groups.controller.ts
│ ├── addon-groups.module.ts
│ └── dto/
│ ├── create-addon-group.dto.ts
│ └── update-addon-group.dto.ts
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
POST /auth/setup — seed DB + reset sequenze (PUBLIC)
POST /auth/login — login cassiere (PIN) (PUBLIC)
POST /auth/admin-companies — WIZARD: admin PIN -> lista company gestibili (PUBLIC)
POST /auth/reset-sequences — resetta sequenze autoincrement (PUBLIC)
GET /auth/me — profilo utente logato
GET /auth/health — health check (PUBLIC)
POST /auth/machine-token — genera machine token (hardwareId + posClientId)

Company
GET /companies — lista sedi (attivi + inattivi, frontend filtra)
POST /companies — crea sede
GET /companies/:id — dettaglio sede (con warehouses e posClients)
PATCH /companies/:id — aggiorna sede
DELETE /companies/:id — soft delete sede

Warehouse
GET /warehouses?companyId=X — lista magazzini per sede (attivi + inattivi, frontend filtra)
POST /warehouses — crea magazzino
GET /warehouses/:id — dettaglio magazzino (con inventory e posClients)
PATCH /warehouses/:id — aggiorna magazzino
DELETE /warehouses/:id — soft delete magazzino

POS Client
GET /pos-clients?companyId=X — lista tutti i POS per sede (attivi + inattivi)
POST /pos-clients — registra POS Client (admin only)
POST /pos-clients/setup — WIZARD: admin PIN + dati POS -> crea/riattiva POS + machine token (PUBLIC)
GET /pos-clients/:id — dettaglio POS (con ultimi turni)
PATCH /pos-clients/:id — aggiorna POS
DELETE /pos-clients/:id — soft delete POS (setta isActive=false)
PATCH /pos-clients/:id/reactivate — riattiva POS disattivato
POST /pos-clients/:id/self-deactivate — il POS stesso si disattiva con il proprio machine token
POST /pos-clients/:id/sync — registra sync timestamp

Material
GET /materials — lista materiali per company (inventory:read)
POST /materials — crea materiale con unita' multiple (inventory:create)
GET /materials/:id — dettaglio materiale
PATCH /materials/:id — aggiorna materiale (inventory:update)
DELETE /materials/:id — soft delete materiale (inventory:delete)

Product Category (Gerarchico)
GET /product-categories — lista categorie albero per company (product:read)
POST /product-categories — crea categoria con parentId (product:create)
GET /product-categories/:id — dettaglio categoria (con children e parent)
PATCH /product-categories/:id — aggiorna categoria (anti-ciclo) (product:update)
DELETE /product-categories/:id — soft delete ricorsivo categoria + figli (product:delete)

Product
GET /products — lista prodotti per company
POST /products — crea prodotto con varianti (ricette nestate), addonGroupIds, modifierGroupIds
GET /products/:id — dettaglio prodotto
PATCH /products/:id — aggiorna prodotto (upsert varianti/ricette/addon/modifier)
DELETE /products/:id — soft delete prodotto

Modifier Groups
GET /modifier-groups — lista gruppi per company (product:read)
POST /modifier-groups — crea gruppo con opzioni (product:create)
GET /modifier-groups/:id — dettaglio gruppo (con options e material)
DELETE /modifier-groups/:id — soft delete gruppo (product:delete)

Addon Groups (NUOVO — 2026-07-01)
GET /addon-groups — lista gruppi addon per company (product:read)
POST /addon-groups — crea gruppo addon con items (product:create)
GET /addon-groups/:id — dettaglio gruppo (con items e addonProduct)
PATCH /addon-groups/:id — aggiorna gruppo + items
DELETE /addon-groups/:id — soft delete gruppo

Units
GET /units — lista unita' per company
POST /units — crea unita'
PATCH /units/:id — aggiorna unita'
DELETE /units/:id — soft delete unita'

Unit Conversions
GET /unit-conversions — lista conversioni per company
POST /unit-conversions — crea conversione (fromUnitId, toUnitId, factor)
PATCH /unit-conversions/:id — aggiorna conversione
DELETE /unit-conversions/:id — soft delete conversione

Roles
GET /roles — lista ruoli attivi per company
GET /roles/permissions — lista permessi disponibili raggruppati per categoria
GET /roles/:id — dettaglio ruolo
POST /roles — crea ruolo con permessi
PATCH /roles/:id — aggiorna ruolo
DELETE /roles/:id — soft delete ruolo (blocca se ha utenti attivi)

Users
GET /users — lista utenti (con role e permissions)
GET /users/:id — dettaglio utente
POST /users — crea utente (roleId: number, companyId: number)
PATCH /users/:id — aggiorna utente (roleId?: number)
DELETE /users/:id — soft delete utente

Sync POS
GET /products/pos/:companyId — ProductsService.getProductsForPOS() — restituisce prodotti attivi con: category, variants, recipes (con unit), modifiers, addons (con items)

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
Nuove tabelle addon: AddonGroup, AddonGroupItem, ProductAddon (2026-07-01)
Nuove tabelle unita': Unit, UnitConversion
Material.unit (string) -> Material.unitId (FK -> Unit)
ProductRecipe.unit (string) -> ProductRecipe.unitId (FK -> Unit)
ProductCategoriesService e ProductCategoriesController con CRUD completo
ProductCategory gerarchico con parentId/children (2026-06-27)
ProductsService aggiornato per gestire addonGroupIds nel create/update (2026-07-01)
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
Frontend: Pagina /addon-groups con routing e menu (2026-07-01)
Frontend: Form prodotto completo in creazione con dropdown categorie gerarchico (2026-06-27)
Frontend: Form prodotto edit completo con varianti/ricette/modifier/addon (2026-06-27)
Frontend: Addon con addonGroupIds invece di addon inline (2026-07-01)
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
Frontend: Design System SCSS unificato Company/Warehouse/POS Client (2026-06-28)
Frontend: Toggle "Show inactive" su Company/Warehouse/POS Client (2026-06-28)
Backend: WarehousesService.findAll() ritorna tutti (attivi + inattivi) (2026-06-28)
Frontend: Fix ngModel su signal — pattern [ngModel] + (ngModelChange) (2026-06-28)
Frontend: ConfirmDialogService + ConfirmDialogComponent modale personalizzata (2026-06-28)
Backend: CompaniesService.update() filtra campi relazioni (2026-06-28)
Backend: WarehousesService.update() filtra campi relazioni (2026-06-28)
Frontend: Reactivate Company/Warehouse invia solo { isActive: true } (2026-06-28)
Frontend: Reactivate POS Client usa endpoint dedicato PATCH /pos-clients/:id/reactivate (2026-06-28)
Frontend: Product Categories Design System SCSS, tabella gerarchica, toggle inactive, ConfirmDialog (2026-06-28)
Frontend: Products Component refactor — formData signal, selettore categorie cascata dinamico N livelli (2026-06-28)
Frontend: Products field wrapper con label, card sections, btn-icon-danger, btn-small dashed (2026-06-28)
Frontend: Products getCategoryHierarchy() percorso completo, findCategoryById() ricorsivo (2026-06-28)
Backend: AddonGroupsModule con CRUD completo (2026-07-01)
Backend: AddonGroup + AddonGroupItem + ProductAddon in schema Prisma (2026-07-01)
Frontend: AddonGroupsComponent con routing in app.routes (2026-07-01)
Frontend: LayoutComponent menu con voce "Addon Groups" in Catalog (2026-07-01)

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
✅ Modulo AddonGroups dedicato (2026-07-01)
✅ Refactor storeId -> companyId (completato, DB ricreato)
✅ Migration refactor_remove_store (completato, DB ricreato)
☐ Aggiornare POS Client C#: modelli LocalAddonGroup, LocalAddonGroupItem
☐ Aggiornare SyncService POS per scaricare addon groups

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
☐ Layout responsive Materials, Products, Categories, ModifierGroups, AddonGroups
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
☐ Direttiva \*appHasPermission per nascondere bottoni/azioni
☐ Route guard per bloccare accesso a pagine senza permesso
☐ POS Client: PermissionService C# per verificare permessi offline
☐ POS Client: Richiesta autorizzazione PIN per sconti/rimborsi

Decisioni architetturali prese
Company = Sede fisica: Ogni sede (Phuket, Bangkok, Chiang Mai) e' una Company con dati anagrafici completi per scontrini e fatture.
No Store intermedia: Eliminata la tabella Store. Company gestisce direttamente warehouses, users, products, etc.
Warehouse senza type: Rimosso il campo type perche' il nome gia' descrive la funzione ("Bar Principale", "Shisha Lounge", "Ufficio"). Ogni magazzino puo' ricevere ordini propri.
POSClient -> Warehouse: Ogni cassa e' associata a un magazzino. Incasso separato per POS Client (non aggregato a livello warehouse).
Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entita' separate. Si collegano tramite tabelle ponte.
AddonGroup: gruppo riutilizzabile di addon (es. "Bottiglie", "Shisha Flavors"). Collegato a Product via ProductAddon (tabella ponte).
AddonGroupItem: definisce quali prodotti sono dentro un gruppo addon, con quantityValue e price custom.
quantityValue su AddonGroupItem: definisce il "peso" dell'addon (es. caraffa = 3), diverso dalla quantita' venduta.
maxQuantity su AddonGroup: limite di addon selezionabili per quel gruppo (es. max 4 bottiglie). 0 = illimitato.
Modifier = Opzione che modifica il prodotto: es. "Scegli il mixer" con opzioni Coca/Sprite/Tonic. Ogni opzione puo' consumare materiale (quantityConsumed) e avere priceAdjustment.
Ricette nestate (approccio B): ProductRecipe e' nestato dentro ProductVariantDto. Ogni variante "porta" le proprie ricette. Il backend crea la variante, ottiene l'ID, poi crea le ricette con quel variantId.
Addon price custom: AddonGroupItem ha campo price opzionale. Se valorizzato, sovrascrive il prezzo del prodotto-addon (utile per "gratis" o prezzi promozionali).
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
RBAC: Role.permissions e' un JSON array di stringhe (es. ["product:read", "sale:create", "*"]). Il backend include permissions nel JWT. Il frontend puo' usare hasPermission() per filtrare UI. Il POS Client riceve permissions dal JWT al login e li salva in SQLite per uso offline.
Toast custom: ToastService standalone con signal(), zero dipendenze esterne. ToastComponent globale nel Layout. Auto-close 3s (success/info) o 5s (error/warning).
Layout menu: MenuGroup / MenuItem con icon: string (classe Font Awesome, es. 'fa-puzzle-piece'), NON emoji.

Note per il debugging
Il backend gira su http://localhost:3000
Il frontend admin su http://localhost:4200
CORS gia' configurato per origini localhost:4200 e 127.0.0.1:4200
Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema
Dopo modifiche allo schema: npx prisma migrate dev --name <nome>
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

Generato il 2026-07-01. Modifica e aggiorna liberamente.
