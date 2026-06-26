POS Enterprise - Project Context
File di contesto condiviso per mantenere la continuita tra sessioni di lavoro. Aggiorna la sezione "Ultimo aggiornamento" ogni volta che modifichi qualcosa.
Ultimo aggiornamento: 2026-06-26
Wizard POS Client Setup implementato
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
REGOLA FERMA: Tutta la reattivita UI usa Angular Signals (signal(), computed()). MAI usare proprieta plain o _ngIf per stato che deve aggiornare la UI. Usare sempre @if / @for (control flow) nei template.
Struttura Frontend (models / services)
Tutte le interfacce sono centralizzate in core/models/:
company.model.ts -> Company, CreateCompanyRequest, UpdateCompanyRequest
warehouse.model.ts -> Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest
pos-client.model.ts -> POSClient, CreatePOSClientRequest, UpdatePOSClientRequest
auth.model.ts -> AuthUser, LoginResponse
user.model.ts -> User, Role, UserRole
sale.model.ts -> Sale, SaleItem, Payment, SalesReport
material.model.ts -> Material, InventoryItem, InventoryTransactionDto
unit.model.ts -> Unit
unit-conversion.model.ts -> UnitConversion
product.model.ts -> Product, ProductVariant, ProductRecipe, ModifierGroup, ModifierOption, ProductModifier, ProductAddon, ProductAddonItem, ProductCategory
product-addon.model.ts -> CreateProductAddonDto, UpdateProductAddonDto, ProductAddonItemDto
Database - Stato entita
Table
Entita Stato Note
Company ✅ Multi-sede base. Campi anagrafici completi per scontrini/fatture
Warehouse ✅ Magazzini per company. Rimosso type, aggiunti address, phone
POSClient ✅ FK companyId + warehouseId. Incasso separato per cassa
Role / User / UserSession ✅ RBAC con permissions JSON. companyId al posto di storeId
Unit ✅ Unita di misura referenziate (piece, volume, weight, container)
UnitConversion ✅ Conversioni tra unita
Material ✅ FK su Unit (unitId), categorie gestite via input
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
Modifiche recenti (2026-06-25/26):
Eliminata tabella Store -- tutte le FK storeId diventate companyId
Company arricchita -- aggiunti: legalName, vatNumber, postalCode, city, province, country, logoUrl
Warehouse -- rimosso type, aggiunti address, phone. FK storeId -> companyId
POSClient -- aggiunto warehouseId (FK -> Warehouse). FK storeId -> companyId
Tutte le altre tabelle -- storeId -> companyId (User, Material, Unit, UnitConversion, Product, ModifierGroup, Supplier, Sale, SyncMetadata, ProductCategory)
Backend - Moduli esistenti
src/
├── app.module.ts # Prisma, Auth, Products, Materials, Sales, Users, ProductAddon, ProductCategories, Units, UnitConversions, Companies, Warehouses, PosClients
├── prisma/
│ └── schema.prisma # Schema completo (Store eliminata, Company arricchita)
├── companies/
│ ├── companies.service.ts
│ ├── companies.controller.ts
│ ├── companies.module.ts
│ └── dto/company.dto.ts
├── warehouses/
│ ├── warehouses.service.ts
│ ├── warehouses.controller.ts
│ ├── warehouses.module.ts
│ └── dto/warehouse.dto.ts
├── pos-clients/
│ ├── pos-clients.service.ts # CRUD + setup() per wizard POS
│ ├── pos-clients.controller.ts
│ ├── pos-clients.module.ts # Importa JwtModule configurato
│ └── dto/
│ ├── pos-client.dto.ts
│ └── setup-pos-client.dto.ts # DTO per wizard setup
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
│ ├── product-categories.service.ts
│ ├── product-categories.controller.ts
│ ├── product-categories.module.ts
│ └── dto/
├── units/
│ ├── units.service.ts
│ ├── units.controller.ts
│ ├── units.module.ts
│ └── dto/
├── unit-conversions/
│ ├── unit-conversions.service.ts
│ ├── unit-conversions.controller.ts
│ ├── unit-conversions.module.ts
│ └── dto/
├── materials/
├── sales/
├── auth/
│ ├── auth.service.ts # + getAdminCompanies() per wizard
│ ├── auth.controller.ts # + POST /auth/admin-companies
│ ├── auth.module.ts
│ └── dto/
└── users/
Endpoint API
Company
GET /companies -- lista sedi
POST /companies -- crea sede
GET /companies/:id -- dettaglio sede (con warehouses e posClients)
PATCH /companies/:id -- aggiorna sede
DELETE /companies/:id -- soft delete sede
Warehouse
GET /warehouses?companyId=X -- lista magazzini per sede
POST /warehouses -- crea magazzino
GET /warehouses/:id -- dettaglio magazzino (con inventory e posClients)
PATCH /warehouses/:id -- aggiorna magazzino
DELETE /warehouses/:id -- soft delete magazzino
POS Client
GET /pos-clients?companyId=X -- lista POS per sede
POST /pos-clients -- registra POS Client (admin only)
POST /pos-clients/setup -- WIZARD: admin PIN + dati POS -> crea POS + machine token (PUBLIC)
GET /pos-clients/:id -- dettaglio POS (con ultimi turni)
PATCH /pos-clients/:id -- aggiorna POS
DELETE /pos-clients/:id -- soft delete POS
POST /pos-clients/:id/sync -- registra sync timestamp
Auth
POST /auth/setup -- seed DB
POST /auth/login -- login cassiere (PIN)
POST /auth/admin-companies -- WIZARD: admin PIN -> lista company gestibili (PUBLIC)
GET /auth/me -- profilo utente loggato
GET /auth/health -- health check (PUBLIC)
POST /auth/machine-token -- genera machine token (hardwareId + posClientId)
Product Addon
POST /product-addons -- crea addon group
GET /product-addons/product/:productId -- lista addon di un prodotto
GET /product-addons/:id -- dettaglio addon
PATCH /product-addons/:id -- aggiorna addon
DELETE /product-addons/:id -- soft delete addon
Product Categories
GET /product-categories -- lista per company
POST /product-categories -- crea categoria
PATCH /product-categories/:id -- aggiorna categoria
DELETE /product-categories/:id -- soft delete categoria
Units
GET /units -- lista unita per company
POST /units -- crea unita
PATCH /units/:id -- aggiorna unita
DELETE /units/:id -- soft delete unita
Unit Conversions
GET /unit-conversions -- lista conversioni per company
POST /unit-conversions -- crea conversione (fromUnitId, toUnitId, factor)
PATCH /unit-conversions/:id -- aggiorna conversione
DELETE /unit-conversions/:id -- soft delete conversione
Sync POS
GET /products/pos-sync -- ProductsService.getProductsForPOS()
Restituisce prodotti attivi con: category, variants, recipes (con unit), modifiers, addons (con items)
POS Client (C# WPF) - Wizard Setup 3-Step (IMPLEMENTATO 2026-06-26)
Flusso wizard:
Step 1: Inserisci URL server -> GET /auth/health (verifica connessione)
Step 2: Admin username + PIN -> POST /auth/admin-companies
-> Ritorna lista company gestibili dall'admin
Step 3: Dropdown Company (auto-seleziona se una sola)
Dropdown Warehouse (caricato dal server)
Register Name (default: "Main Register")
Location (default: "Main Counter")
Hardware ID (auto-generato, stabile per macchina)
Una sola POST /pos-clients/setup con tutti i dati
-> Ritorna: posClientId, machineToken (10 anni), companyId, warehouseId
Salva SetupConfig in SQLite (AppConfig key="pos_setup")
Popola AppState -> avvia MainWindow
File POS Client modificati/aggiunti:
Models/SetupConfig.cs -- NUOVO: modello config locale (ServerUrl, CompanyId, WarehouseId, PosClientId, MachineToken, HardwareId, RegisterName, Location)
Views/SetupWizardWindow.xaml -- NUOVO: UI wizard 3 step
Views/SetupWizardWindow.xaml.cs -- NUOVO: code-behind wizard
Services/ConfigService.cs -- MODIFICATO: +LoadSetupConfig(), +SaveSetupConfig(), +ClearSetupConfig()
Services/AppState.cs -- MODIFICATO: +ServerUrl, +HardwareId, +PosClientId, +WarehouseId, +RegisterName
Services/ApiService.cs -- MODIFICATO: costruttore usa AppState.ServerUrl
Services/ConnectionService.cs -- MODIFICATO: IsServerOnlineAsync usa AppState.ServerUrl
App.xaml.cs -- MODIFICATO: OnStartup apre wizard se manca config, ShutdownMode.OnExplicitShutdown
MainWindow.xaml -- MODIFICATO: +bottone "Reconfigure"
MainWindow.xaml.cs -- MODIFICATO: +btnReconfigure_Click, usa AppState.ServerUrl
Views/LoginWindow.xaml.cs -- MODIFICATO: usa AppState.HardwareId e AppState.PosClientId
Views/CashierWindow.xaml.cs -- MODIFICATO: usa AppState.PosClientId e AppState.WarehouseId
Sicurezza wizard:
POST /auth/admin-companies: verifica PIN + ruolo admin (name === 'admin' o permissions includes '_')
POST /pos-clients/setup: verifica PIN + ruolo admin + company access
Super admin (permissions '\*'): puo configurare qualsiasi company
Admin normale: puo configurare SOLO la sua company
Machine token: JWT con type='machine', expiresIn='3650d' (10 anni)
Riconfigurazione:
Bottone "Reconfigure" in MainWindow -> cancella config SQLite -> riapre wizard
Se l'utente chiude il wizard senza completare -> app si chiude
POS Client (C# WPF) - Stato generale
Modelli dati SQLite:
LocalCompany -- dati sede per scontrini
LocalWarehouse -- magazzini associati
LocalPOSClient -- dati cassa locale
LocalProduct -- con Addons (List)
LocalProductAddon -- con Items (List)
LocalProductAddonItem -- con AddonProductId, QuantityValue
LocalSaleItemAddon -- con AddonProductId, Quantity, QuantityValue, UnitPrice, TotalPrice
LocalMaterial -- con Unit (string display)
Servizi:
ApiService -- REST client con RestSharp, JWT auth
SyncService -- scarica company, warehouses, pos-clients, prodotti, varianti, modifier, addon, inventario
OfflineQueueService -- salva vendite offline, sync asincrono con retry
ConfigService -- gestione token auth + setup config in SQLite
UI Vendita:
CashierWindow -- griglia prodotti, carrello, pagamento
ProductOptionWindow -- selezione modifier per prodotto
AddonSelectionWindow -- selezione addon con quantita (+/- bottoni), rispetto maxQuantity
Flusso: Prodotto -> Addon (se presenti) -> Modifier (se presenti) -> Variante (se presenti) -> Cart
Cosa e fatto ✅
Schema Prisma completo per tutte le entita core
Eliminata tabella Store, tutte le FK storeId -> companyId
Company arricchita con campi anagrafici per scontrini/fatture
Warehouse senza type, con address e phone
POSClient con warehouseId per associazione magazzino
Fix relazioni rotte (User.cashMovements, User.createdTransfers, CashMovement.user)
CRUD prodotti, varianti, ricette, modifier groups, modifier options
Assegnazione modifier ai prodotti (ProductModifier)
Nuove tabelle addon: ProductAddon, ProductAddonItem, SaleItemAddon
Nuove tabelle unita: Unit, UnitConversion
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
Frontend: Pagina /materials con CRUD completo (dropdown Unit)
Frontend: Pagina /units con CRUD completo
Frontend: Pagina /unit-conversions con CRUD completo
Frontend: Form prodotto completo in creazione
Frontend: Allineamento modello Product (price -> basePrice, category -> categoryId)
Frontend: Tutti i modelli spostati in core/models/
Frontend: Tutti i service puliti e allineati ai modelli
POS Client: AddonSelectionWindow (UI per selezionare addon con quantita)
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
POS Client: Riconfigurazione da UI (bottone Reconfigure)
Cosa manca / Roadmap 🚧
Fase 1: Refactor architettura (IN CORSO)
✅ Schema Prisma: eliminata Store, arricchita Company, aggiornate FK
✅ Backend: CompaniesModule, WarehousesModule, PosClientsModule
✅ Frontend: CompanyComponent, WarehouseComponent, PosClientComponent
☐ Migration Prisma: npx prisma migrate dev --name refactor_remove_store
☐ Aggiornare tutti i service esistenti che usano storeId -> companyId
☐ Aggiornare auth/guard per usare companyId invece di storeId
☐ Aggiornare POS Client C#: modelli LocalCompany, LocalWarehouse, LocalPOSClient
☐ Aggiornare SyncService POS per scaricare company/warehouse/posclient
Fase 2: POS Client Wizard Setup ✅ COMPLETATA (2026-06-26)
✅ UI Wizard 3-Step (URL -> Admin -> Config)
✅ Endpoint backend: POST /auth/admin-companies
✅ Endpoint backend: POST /pos-clients/setup
✅ Verifica admin PIN + ruolo
✅ Super admin vs admin normale (company access)
✅ Machine token JWT (10 anni)
✅ Configurazione persistente SQLite
✅ Riconfigurazione da UI
☐ Test end-to-end con piu company
☐ Gestione errore se server non raggiungibile durante sync
Fase 3: Inventario & Reporting
☐ Consumo materiale per addon nelle vendite (usando conversioni unita)
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
Decisioni architetturali prese
Company = Sede fisica: Ogni sede (Phuket, Bangkok, Chiang Mai) e una Company con dati anagrafici completi per scontrini e fatture.
No Store intermedia: Eliminata la tabella Store. Company gestisce direttamente warehouses, users, products, etc.
Warehouse senza type: Rimosso il campo type perche il nome gia descrive la funzione ("Bar Principale", "Shisha Lounge", "Ufficio"). Ogni magazzino puo ricevere ordini propri.
POSClient -> Warehouse: Ogni cassa e associata a un magazzino. Incasso separato per POS Client (non aggregato a livello warehouse).
Addon = Product: gli addon sono a tutti gli effetti prodotti nel catalogo, non entita separate. Si collegano tramite tabelle ponte.
quantityValue su ProductAddonItem: definisce il "peso" dell'addon (es. caraffa = 3), diverso dalla quantita venduta.
maxQuantity su ProductAddon: limite di addon selezionabili per quel prodotto (es. max 4 bottiglie). 0 = illimitato.
Soft delete: tutte le entita usano isActive invece di cancellazione fisica.
Multi-sede: ogni entita e scoped su companyId.
POS Client C# WPF: app desktop Windows con SQLite locale per resilienza offline. Sync via REST API.
Frontend models: tutte le interfacce centralizzate in core/models/ per coerenza e riusabilita.
Unita referenziate: Material e ProductRecipe usano FK su Unit (unitId) invece di stringhe. Le conversioni tra unita sono gestite da UnitConversion.
Coerenza inventario: 1 materiale = 1 unita base. Le ricette consumano materiali in unita specifiche. Le conversioni permettono di tradurre tra unita di acquisto, stoccaggio e vendita.
Wizard Setup POS: approccio endpoint unico (POST /pos-clients/setup) per semplicita e sicurezza. Admin PIN verificato lato server, machine token generato automaticamente.
Note per il debugging
Il backend gira su http://localhost:3000
Il frontend admin su http://localhost:4200
CORS gia configurato per origini localhost:4200 e 127.0.0.1:4200
Prisma Client generato automaticamente, ricordare npx prisma generate dopo modifiche schema
Dopo modifiche allo schema: npx prisma migrate dev --name <nome>
POS Client DB SQLite: %LOCALAPPDATA%\POSClient.db (Windows)
Per ricreare DB SQLite: cancellare il file .db e riavviare l'app (usa EnsureCreated())
Unita seed di default: Piece (pc), Gram (g), Milliliter (ml), Bottle (btl), Can (can), Box (box), Glass (glass)
POS Client log: %LOCALAPPDATA%\POS_Client_Log.txt
POS Client config: %LOCALAPPDATA%\POS.Client\config.json (DEPRECATO, ora in SQLite AppConfig)
Come usare questo file nelle nuove chat
Quando riapri una nuova sessione, fornisci questo link:
https://raw.githubusercontent.com/LorisLancia/POS-Enterprise-Backend-NestJs/main/PROJECT_CONTEXT.md
E digita: "Leggi il PROJECT_CONTEXT.md e aggiorniamo."
Generato il 2026-06-26. Modifica e aggiorna liberamente.
