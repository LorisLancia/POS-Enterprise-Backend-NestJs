POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuità tra sessioni di lavoro. Aggiorna la sezione "Ultimo aggiornamento" ogni volta che modifichi qualcosa.
Ultimo aggiornamento: 2026-06-27
Cosa è stato fatto oggi (2026-06-27)
Frontend - Material & Products
Material model: allineato campo minStock (prima minStockLevel) al backend Prisma
Materials component: tipi espliciti su tutti i signal(), DTO CreateMaterialDto locale per matchare class-validator backend (minStock: string, quantity: string, senza isActive sulle unità)
Products component: tipi espliciti su tutti i signal(), RecipeUnit esplicito al posto di inferenza TypeScript never
Fix build Angular: tutti i signal<T>() tipizzati per evitare never[] in strict mode
Backend - Auth & Material
main.ts: JwtAuthGuard globale con Reflector per supportare @Public()
AuthController: @Public() aggiunto a setup e login (prima mancavano, bloccavano con 401)
MaterialsService: fix minStock ternary (dto.minStock !== undefined invece di truthy check per evitare minStock="0" -> null)
seed.service.ts: aggiunto resetSequences() che resetta tutte le sequenze autoincrement PostgreSQL a MAX(id) + 1
AuthController: endpoint POST /auth/reset-sequences per reset manuale
prisma/seed.ts: rimossi tutti gli ID espliciti su Material, MaterialUnit, Product, ProductRecipe. Usa findFirst + create/update invece di upsert con ID fissi. Chiama resetSequences() alla fine.
Fix sequenze autoincrement (P2002)
Problema: Prisma creava record con id esplicito nel seed, ma la sequenza PostgreSQL restava a 1. Quando l'app creava nuovi materiali, Prisma tentava id=1 -> conflitto Unique constraint failed on id.
Soluzione: seed senza ID espliciti + resetSequences() post-seed.
Wizard POS Client Setup — FIX completati (2026-06-26)
Reconfigure dal POS Client ora chiama self-deactivate sul server (se online) prima di cancellare la config locale
Backend setup() riattiva POS disattivato invece di bloccare con "already registered"
Backend findAll() ritorna tutti i POS (attivi + inattivi) — frontend filtra con toggle
Aggiunto endpoint POST /pos-clients/:id/self-deactivate (protetto da machine token) e PATCH /pos-clients/:id/reactivate
Schema Prisma: aggiunto updatedAt a POSClient
Seed: rimosso POSClient dal seed (viene creato solo dal wizard)
POS Client App.xaml.cs: ShutdownMode = OnLastWindowClose (l'app si chiude correttamente)
POS Client MainWindow.xaml.cs: btnReconfigure_Click verifica server online, disattiva via HttpClient, cleanup completo AppState, apre nuova MainWindow e chiude la vecchia
Repository GitHub
Table
Repo URL Tecnologia
Backend https://github.com/LorisLancia/POS-Enterprise-Backend-NestJs.git NestJS + Prisma + PostgreSQL
Frontend Admin https://github.com/LorisLancia/POS-Enterprise-Frontend-Angular.git Angular v21.2.16 (Signals)
POS Client https://github.com/LorisLancia/POS.Client.git C# WPF .NET + SQLite
Stack tecnologico
Table
Layer Tecnologia Versione / Note
Backend sede NestJS v11, TypeScript
ORM Prisma v5.22.0, PostgreSQL
DB Sede PostgreSQL 16+ JSONB per varianti/modifier flessibili, replication ready
Frontend gestione Angular v21.2.16, Signals (@if/@for, signal(), computed())
POS Client C# WPF .NET MVVM, SQLite locale per offline
Comunicazione REST API + WebSocket REST per bulk sync; WebSocket per real-time
Auth JWT + Passport PIN-based per utenti POS; Machine token (10 anni) per POS Client
Pattern frontend (Angular)
REGOLA FERMA: Tutta la reattività UI usa Angular Signals (signal(), computed()). MAI usare proprietà plain o \*ngIf per stato che deve aggiornare la UI. Usare sempre @if / @for (control flow) nei template.
REGOLA FERMA: Tutti i signal([]) devono avere tipo esplicito: signal<Material[]>([]) invece di signal([]) per evitare never[] in TypeScript strict mode.
Struttura Frontend (models / services)
Tutte le interfacce sono centralizzate in core/models/:
company.model.ts -> Company, CreateCompanyRequest, UpdateCompanyRequest
warehouse.model.ts -> Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest
pos-client.model.ts -> POSClient, CreatePOSClientRequest, UpdatePOSClientRequest
auth.model.ts -> AuthUser, LoginResponse
user.model.ts -> User, Role, UserRole
sale.model.ts -> Sale, SaleItem, Payment, SalesReport
material.model.ts -> Material, MaterialUnit, InventoryItem, InventoryTransactionDto
unit.model.ts -> Unit
unit-conversion.model.ts -> UnitConversion
product.model.ts -> Product, ProductVariant, ProductRecipe, ModifierGroup, ModifierOption, ProductModifier, ProductAddon, ProductAddonItem, ProductCategory
product-addon.model.ts -> CreateProductAddonDto, UpdateProductAddonDto, ProductAddonItemDto
Database - Stato entità
Table
Entita' Stato Note
Company ✅ Multi-sede base. Campi anagrafici completi per scontrini/fatture
Warehouse ✅ Magazzini per company. Rimosso type, aggiunti address, phone
POSClient ✅ FK companyId + warehouseId. updatedAt aggiunto 2026-06-26. Incasso separato per cassa
Role / User / UserSession ✅ RBAC con permissions JSON. companyId al posto di storeId
Unit ✅ Unita' di misura referenziate (piece, volume, weight, container)
UnitConversion ✅ Conversioni tra unita'
Material ✅ FK su Unit (unitId), categorie gestite via input. Multi-unita' con MaterialUnit. minStock (Decimal)
Product ✅ basePrice, taxRate, trackInventory, allowDecimalQty
ProductCategory ✅ Con colore e sortOrder
ProductVariant ✅ Small, Large, priceAdjustment
ProductRecipe ✅ BOM con FK su Unit (unitId), variantId opzionale
ModifierGroup ✅ selectionType: single/multiple, min/max select
ModifierOption ✅ priceAdjustment, materialId, quantityConsumed
ProductModifier ✅ Collega Product <-> ModifierGroup (isRequired, sortOrder)
Inventory / InventoryTransaction ✅ Traccia giacenza e movimenti
Supplier / PurchaseOrder / POItem ✅ Ordini acquisto
Shift / CashMovement ✅ Turni cassa. Legati a POSClient (incasso separato)
Sale / SaleItem / SaleItemModifier / Payment ✅ Vendite complete
SyncMetadata ✅ Per sync POS offline
ProductAddon ✅ Tabella ponte: Product -> Addon (maxQuantity, sortOrder)
ProductAddonItem ✅ Lista prodotti-addon con quantityValue
SaleItemAddon ✅ Traccia addon selezionati in una vendita
Store ❌ ELIMINATA Sostituita da Company direttamente
Schema Prisma completo (attuale)
Vedere prisma/schema.prisma nel repository.
Modifiche recenti (2026-06-27):
Material: multi-unita' con MaterialUnit (tabella ponte). minStock come Decimal.
Seed: rimossi ID espliciti, aggiunto resetSequences()
Backend: JwtAuthGuard globale, @Public() su login/setup
Modifiche recenti (2026-06-26):
POSClient — aggiunto updatedAt DateTime @updatedAt
Seed — rimosso POSClient dal seed (evita conflitto autoincrement)
setup() — riattiva POS disattivato invece di bloccare
Backend - Moduli esistenti
plain
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
├── product-addon/
├── product-categories/
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
└── users/
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
GET /companies — lista sedi
POST /companies — crea sede
GET /companies/:id — dettaglio sede (con warehouses e posClients)
PATCH /companies/:id — aggiorna sede
DELETE /companies/:id — soft delete sede
Warehouse
GET /warehouses?companyId=X — lista magazzini per sede
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
Product Addon
POST /product-addons — crea addon group
GET /product-addons/product/:productId — lista addon di un prodotto
GET /product-addons/:id — dettaglio addon
PATCH /product-addons/:id — aggiorna addon
DELETE /product-addons/:id — soft delete addon
Product Categories
GET /product-categories — lista per company
POST /product-categories — crea categoria
PATCH /product-categories/:id — aggiorna categoria
DELETE /product-categories/:id — soft delete categoria
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
Sync POS
GET /products/pos-sync — ProductsService.getProductsForPOS() — restituisce prodotti attivi con: category, variants, recipes (con unit), modifiers, addons (con items)
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
ProductsService aggiornato per gestire addon inline nel create/update product
ProductsService aggiornato per includere unit nelle ricette
MaterialsService aggiornato per includere unit nei materiali
getProductsForPOS aggiornato per includere addon e unit nella risposta sync
Frontend: ProductAddonManagerComponent con Signals
Frontend: ProductAddonService per chiamare API addon
Frontend: Pagina /categories con CRUD completo
Frontend: Pagina /materials con CRUD completo (dropdown Unit, multi-unita', minStock)
Frontend: Pagina /units con CRUD completo
Frontend: Pagina /unit-conversions con CRUD completo
Frontend: Form prodotto completo in creazione
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
Frontend: Material model allineato a minStock (2026-06-27)
Frontend: Products/Materials component con tipi espliciti signal (2026-06-27)
Cosa manca / Roadmap 🚧
Fase 1: Refactor architettura (IN CORSO)
✅ Schema Prisma: eliminata Store, arricchita Company, aggiornate FK
✅ Backend: CompaniesModule, WarehousesModule, PosClientsModule
✅ Frontend: CompanyComponent, WarehouseComponent, PosClientComponent
✅ POSClient.updatedAt aggiunto (2026-06-26)
✅ Material multi-unita' con MaterialUnit (2026-06-27)
☐ Migration Prisma: npx prisma migrate dev --name refactor_remove_store (se non ancora fatto)
☐ Aggiornare tutti i service esistenti che usano storeId -> companyId
☐ Aggiornare auth/guard per usare companyId invece di storeId
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
☐ Consumo materiale per addon nelle vendite (usando conversioni unita')
☐ Report margini che includono costo addon
☐ Alert stock per materiali consumati come addon
☐ Logica conversione: es. vendita 1 bicchiere (30ml) -> scala 30ml dal stock bottiglia (750ml)
☐ Report per sede (company) con dati anagrafici su scontrini
☐ Report aggregati multi-sede (cloud dashboard)
Fase 4: Sync & Offline
☐ Sync dati sede (company, warehouse) nel POS Client
☐ Sync automatico all'avvio
☐ Gestione offline completa (vendite, sync, retry)
☐ WebSocket per notifiche real-time
Fase 5: UI/UX Polish
☐ Layout responsive Materials, Products, Categories
☐ Tema coerente su tutte le pagine
☐ Toast notifications per successo/errore
☐ Loading skeletons
Decisioni architetturali prese
Company = Sede fisica: Ogni sede (Phuket, Bangkok, Chiang Mai) e' una Company con dati anagrafici completi per scontrini e fatture.
No Store intermedia: Eliminata la tabella Store. Company gestisce direttamente warehouses, users, products, etc.
Warehouse senza type: Rimosso il campo type perche' il nome gia' descrive la funzione ("Bar Principale", "Shisha Lounge", "Ufficio"). Ogni magazzino puo' ricevere ordini propri.
POSClient -> Warehouse: Ogni cassa e' associata a un magazzino. Incasso separato per POS Client (non aggregato a livello warehouse).
Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entita' separate. Si collegano tramite tabelle ponte.
quantityValue su ProductAddonItem: definisce il "peso" dell'addon (es. caraffa = 3), diverso dalla quantita' venduta.
maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
Soft delete: tutte le entita' usano isActive invece di cancellazione fisica.
Multi-sede: ogni entita' e' scoped su companyId.
POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.
Frontend models: tutte le interfacce centralizzate in core/models/ per coerenza e riusabilita'.
Unita' referenziate: Material e ProductRecipe usano FK su Unit (unitId) invece di stringhe. Le conversioni tra unita' sono gestite da UnitConversion.
Coerenza inventario: 1 materiale = 1 unita' base. Le ricette consumano materiali in unita' specifiche. Le conversioni permettono di tradurre tra unita' di acquisto, stoccaggio e vendita.
Wizard Setup POS: approccio endpoint unico (POST /pos-clients/setup) per semplicita' e sicurezza. Admin PIN verificato lato server, machine token generato automaticamente.
Reconfigure: il POS si disattiva da solo sul server (self-deactivate) usando il proprio machine token, poi cancella la config locale e riparte il wizard. Se il server e' offline, procede comunque con il cleanup locale.
Material multi-unita': MaterialUnit tabella ponte con unit (enum), quantity, isDefault, isPurchaseUnit, isSaleUnit. Permette di definire "1 Piece = 1", "750 ML = 1 bottiglia", "6 Pack = 1 confezione" per lo stesso materiale.
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
Generato il 2026-06-27. Modifica e aggiorna liberamente.
