# ARCHIVOS ENCONTRADOS - ESTRUCTURA DE COTIZACIONES

## BACKEND - Modelos y Esquema

### Prisma Schema
- `/home/user/project/backend/prisma/schema.prisma`
  - Modelos: `quote`, `quote_detail`, `quote_attachment`, `service`, `service_category`, `tax`, `invoice`, `invoice_detail`

## BACKEND - Servicios

### Admin Quote Service
- `/home/user/project/backend/src/modules/admin/services/quoteService.ts` (751 líneas)
  - Funciones core: listQuotes, createQuote, getQuoteById, generateQuotePdf, sendQuoteByEmail, convertQuoteToInvoice, updateQuote, deleteQuote
  - Tipos exportados: QuoteStatusLabel, QuoteSummary, QuoteDetail, QuoteServiceEntry, QuoteAttachmentEntry
  - Validaciones exhaustivas y transacciones ACID

### Client Quote Service
- `/home/user/project/backend/src/modules/client/services/quoteService.ts` (186 líneas)
  - Funciones: listClientQuotes, fetchClientQuoteById, generateInvoiceFromQuote, submitClientQuote
  - Validación de acceso por cliente_id
  - Generación de facturas

## BACKEND - Controladores

### Admin Quote Controller
- `/home/user/project/backend/src/modules/admin/controllers/quoteController.ts` (361 líneas)
  - Controladores: listQuotesCtrl, createQuoteCtrl, getQuoteByIdCtrl, updateQuoteCtrl, deleteQuoteCtrl
  - Acciones: generateQuotePdfCtrl, sendQuoteEmailCtrl, convertQuoteToInvoiceCtrl
  - Parsers: parseQuoteCreatePayload, parseQuoteUpdatePayload, parseQuoteServicesPayload

### Client Quote Controller
- `/home/user/project/backend/src/modules/client/controllers/quoteController.ts` (304 líneas)
  - Controladores: listClientQuotesCtrl, createClientQuoteCtrl, getClientQuoteDetailCtrl, generateInvoiceFromQuoteCtrl
  - Mappers: mapClientQuoteSummary, mapClientQuoteDetail
  - Parsers: parseClientQuoteServices, parseClientQuotePayload

## BACKEND - Rutas

### Admin Quote Routes
- `/home/user/project/backend/src/modules/admin/routes/quoteRoutes.ts`
  - 8 rutas definidas con métodos HTTP

### Client Quote Routes
- `/home/user/project/backend/src/modules/client/routes/quoteRoutes.ts`
  - 4 rutas definidas con métodos HTTP

## FRONTEND - Tipos de Datos

### Admin Quotes Types
- `/home/user/project/frontend/src/modules/admin/quotes/types.ts`
  - Tipos: QuoteStatus, QuoteSummary, QuoteDetail, CreateQuoteInput, UpdateQuoteInput, etc.

### Client Quotes Types
- `/home/user/project/frontend/src/modules/client/quotes/types.ts`
  - Tipos: ClientQuoteSummary, ClientQuoteRecord, CreateClientQuoteInput, etc.

## FRONTEND - Componentes Admin

### Lista de Cotizaciones
- `/home/user/project/frontend/src/modules/admin/quotes/components/QuoteListView.tsx`
  - Tabla ag-grid, búsqueda, crear nueva cotización
  - 356 líneas de código

### Crear Cotización
- `/home/user/project/frontend/src/modules/admin/quotes/components/QuoteCreateForm.tsx`
  - Formulario dinámico con selección de servicios
  - Validación de campos

### Detalle de Cotización
- `/home/user/project/frontend/src/modules/admin/quotes/components/QuoteDetailPageView.tsx`
  - Vista de página con inspector y editor
  - Acciones: PDF, Email, Convertir a factura
  - 201 líneas

### Inspector de Detalles
- `/home/user/project/frontend/src/modules/admin/quotes/components/QuoteDetailInspector.tsx`
  - Información general, servicios, adjuntos
  - Botones de acción

### Editar Cotización
- `/home/user/project/frontend/src/modules/admin/quotes/components/QuoteEditForm.tsx`
  - Formulario de edición
  - Validación de cambios

## FRONTEND - Componentes Cliente

### Lista de Cotizaciones Cliente
- `/home/user/project/frontend/src/modules/client/quotes/components/MainQuotesClient.tsx`
  - Tabla ag-grid con resumen
  - 131 líneas

### Detalle de Cotización Cliente
- `/home/user/project/frontend/src/modules/client/quotes/components/QuoteDetailView.tsx`
  - Vista detallada con información general
  - Tabla de servicios incluidos
  - Sección de adjuntos
  - 174 líneas

## FRONTEND - Servicios/APIs

### Conexión API (frontend)
- `/home/user/project/frontend/src/shared/services/conexion.ts`
  - Funciones API: getAdminQuotesListApi, getAdminQuoteDetailApi, createAdminQuoteApi, updateAdminQuoteApi, deleteAdminQuoteApi
  - Funciones API: generateAdminQuotePdfApi, sendAdminQuoteEmailApi, convertAdminQuoteToInvoiceApi
  - Funciones API cliente: getClientQuotesApi, getClientQuoteDetailApi, submitClientQuoteApi, generateInvoiceFromQuoteApi

## FRONTEND - Componentes Compartidos (Generic)

### Componentes generales para cotizaciones
- `/home/user/project/frontend/src/components/quotes/QuoteDetailPageView.tsx`
- `/home/user/project/frontend/src/components/quotes/QuoteDetailInspector.tsx`
- `/home/user/project/frontend/src/components/quotes/QuoteListView.tsx`

## RESUMEN DE ARCHIVOS CLAVE

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| quoteService.ts (admin) | 751 | Lógica de negocio - cotizaciones |
| quoteController.ts (admin) | 361 | Endpoints HTTP - admin |
| QuoteListView.tsx (admin) | 356 | UI - Lista de cotizaciones |
| QuoteDetailPageView.tsx (admin) | 201 | UI - Detalle de cotización |
| QuoteDetailView.tsx (cliente) | 174 | UI - Detalle para cliente |
| quoteService.ts (cliente) | 186 | Lógica - cotizaciones cliente |
| quoteController.ts (cliente) | 304 | Endpoints HTTP - cliente |
| MainQuotesClient.tsx | 131 | UI - Lista para cliente |

## ENDPOINTS DOCUMENTADOS

### Admin
```
GET    /api/v1/admin/quotes
POST   /api/v1/admin/quotes
GET    /api/v1/admin/quotes/:id
PUT    /api/v1/admin/quotes/:id
DELETE /api/v1/admin/quotes/:id
POST   /api/v1/admin/quotes/:id/pdf
POST   /api/v1/admin/quotes/:id/email
POST   /api/v1/admin/quotes/:id/invoice
```

### Cliente
```
GET    /api/v1/client/quotes
POST   /api/v1/client/quotes
GET    /api/v1/client/quotes/:id
POST   /api/v1/client/quotes/:id/generate-invoice
```

## MODELOS DE DATOS

| Entidad | Campos Clave | Relaciones |
|---------|-------------|-----------|
| quote | id, client_id, description, value, status, created | cliente, detalles, attachments |
| quote_detail | id, quote_id, service_id, quantity, total_value | cotización, servicio |
| quote_attachment | id, quote_id, invoice_id | cotización, factura |
| service | id, name, price, unit, tax_one_id, tax_two_id | categoría, impuestos, detalles |
| invoice | id, client_id, value, status | cliente, detalles, attachments |
| invoice_detail | id, invoice_id, service_id, quantity, total_value | factura, servicio |

## FLUJOS PRINCIPALES

1. **Crear Cotización**: Admin selecciona cliente → Agrega servicios → Sistema calcula total → Guarda
2. **Listar Cotizaciones**: Sistema obtiene todas → Mapea detalles → Incluye info de facturas
3. **Ver Detalle**: Obtiene cotización → Carga servicios → Carga adjuntos (facturas)
4. **Convertir a Factura**: Valida cotización → Crea invoice + details → Vincula en attachment
5. **Actualizar Cotización**: Valida cambios → Si se aprueba, auto-genera factura → Actualiza timestamps

