# Alpha Vantage REST API

REST API en **Node.js + TypeScript + Express** que consume [Alpha Vantage](https://www.alphavantage.co/) y expone endpoints de finanzas transformados, con autenticación JWT, persistencia en Neon (Postgres), cache en memoria, documentación Swagger, validación Zod y despliegue automatizado a Azure App Service for Containers.

## Stack
- **Runtime**: Node.js 20 LTS
- **Package manager**: pnpm 9 (via corepack)
- **HTTP framework**: Express
- **Cliente API pública**: Axios (instancia única con cache)
- **ORM**: TypeORM
- **DB**: Neon (PostgreSQL serverless)
- **Auth**: JWT + bcrypt
- **Validación**: Zod
- **Logging**: Pino + request IDs
- **Docs API**: Swagger UI (`/api/docs`)
- **Tests**: Jest + ts-jest + supertest
- **Contenedor**: Docker multi-stage (node:20-alpine)
- **CI/CD**: GitHub Actions → Azure App Service for Containers

## Qué hace el proyecto
Expone un conjunto de endpoints REST autenticados con JWT que consultan Alpha Vantage (datos de acciones, forex, cripto, noticias, indicadores técnicos), transforman la respuesta cruda a DTOs limpios en camelCase y opcionalmente cachean el resultado para respetar el rate-limit gratuito del proveedor.

## Cómo ejecutarlo localmente

```bash
# 1. Prerequisitos
node --version                 # >= 20
corepack enable && corepack prepare pnpm@9 --activate

# 2. Instalar + variables
pnpm install
cp .env.example .env           # completar DATABASE_URL, ALPHA_VANTAGE_KEY, JWT_SECRET

# 3. Levantar
pnpm dev
curl http://localhost:3000/health
open http://localhost:3000/api/docs
```

### Con Docker
```bash
docker compose up --build
```

## Variables de entorno (mínimas)
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ALPHA_VANTAGE_KEY=tu_api_key
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query
JWT_SECRET=un_secreto_largo
```
Ver `.env.example` para la lista completa.

## API externa consumida
**[Alpha Vantage](https://www.alphavantage.co/documentation/)** — datos financieros (quote, time-series, forex, crypto, fundamentales, news sentiment, indicadores técnicos). Plan gratuito: 5 req/min, 500 req/día. El cache en memoria mitiga el rate-limit en el camino caliente.

## Documentación paso a paso
Ver [`AGENTS.md`](AGENTS.md) y la carpeta [`docs/`](docs/):

- [`00-plan-de-entrega.md`](docs/00-plan-de-entrega.md) — Priorización para prueba de 8h
- [`01-setup-inicial.md`](docs/01-setup-inicial.md)
- [`02-node-express-pnpm.md`](docs/02-node-express-pnpm.md)
- [`03-typeorm-neon.md`](docs/03-typeorm-neon.md)
- [`04-autenticacion-jwt.md`](docs/04-autenticacion-jwt.md)
- [`05-axios-alpha-vantage.md`](docs/05-axios-alpha-vantage.md)
- [`06-endpoints-finanzas.md`](docs/06-endpoints-finanzas.md)
- [`07-testing-jest.md`](docs/07-testing-jest.md)
- [`08-docker.md`](docs/08-docker.md)
- [`09-azure-deploy.md`](docs/09-azure-deploy.md)
- [`10-github-actions-workflow.md`](docs/10-github-actions-workflow.md)
- [`11-features-destacadas.md`](docs/11-features-destacadas.md)

## Endpoints (resumen)

### Auth
| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | JWT |

### Market / Finanzas
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/market/quote/:symbol` | JWT |
| GET | `/api/market/search?q=` | JWT |
| GET | `/api/market/overview/:symbol` | JWT |
| GET | `/api/market/daily/:symbol` | JWT |
| GET | `/api/market/intraday/:symbol` | JWT |
| GET | `/api/market/top-movers` | JWT |
| GET | `/api/market/forex/:from/:to` | JWT |
| GET | `/api/market/crypto/:symbol/:market` | JWT |
| GET | `/api/market/news?tickers=` | JWT |
| GET | `/api/market/earnings/:symbol` | JWT |
| GET | `/api/market/indicators/:symbol/sma` | JWT |
| GET | `/api/market/indicators/:symbol/rsi` | JWT |

### Meta
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/ready` | Readiness (DB) |
| GET | `/api/docs` | Swagger UI |

Detalle en [`docs/06-endpoints-finanzas.md`](docs/06-endpoints-finanzas.md).

## Despliegue en Azure
Despliegue automático vía **GitHub Actions → Azure App Service for Containers**. El workflow corre tests, construye la imagen, la publica a GHCR y deploya. Detalles en [`docs/09-azure-deploy.md`](docs/09-azure-deploy.md) y [`docs/10-github-actions-workflow.md`](docs/10-github-actions-workflow.md).

---

## Almacenamiento de Archivos con Azure Blob + SAS (Documentación — NO implementado)

> **Nota**: la prueba menciona "carga de archivos a un storage de Azure manejando SAS". Esta sección describe el diseño completo **sin implementarlo** — la decisión fue enfocar las 8h en la calidad del core (API + auth + cache + Swagger + CI/CD real).
>
> Aunque se hable de "S3", el equivalente en Azure es **Azure Blob Storage** y las URLs firmadas se llaman **SAS (Shared Access Signature)**. En AWS serían *Presigned URLs*. El concepto es el mismo: URL temporal con permisos acotados que el cliente usa directo sin exponer las claves del bucket.

### ¿Qué es SAS?
Un **Shared Access Signature** es un token criptográfico anexado a la URL de un recurso (blob, contenedor, cola, tabla) que:
- Define **qué operaciones** permite (`read`, `write`, `create`, `delete`, `list`).
- Tiene **expiración** (ej. 5–15 min).
- Opcionalmente restringe por **IP de origen** y **protocolo** (HTTPS).
- **No requiere exponer la storage account key** al cliente.

### Flujo de upload (cliente → backend → blob)

```
[cliente]                [backend Express]             [Azure Blob]
   │                           │                            │
   │  1. POST /api/storage/    │                            │
   │     upload-url            │                            │
   │  (nombre archivo, mime)   │                            │
   │  + JWT                    │                            │
   │ ─────────────────────────►│                            │
   │                           │ 2. generar SAS write       │
   │                           │    (5–15 min, solo write)  │
   │                           │◄── storage key (server)    │
   │                           │                            │
   │  3. { uploadUrl, blobUrl }│                            │
   │◄──────────────────────────│                            │
   │                           │                            │
   │  4. PUT binario directo al blob (x-ms-blob-type: BlockBlob)
   │ ──────────────────────────────────────────────────────►│
   │                           │                            │
   │  5. POST /api/storage/confirm (blobUrl)                │
   │ ─────────────────────────►│                            │
   │                           │ 6. guardar metadata en DB  │
   │                           │    (userId, blobUrl, size) │
```

### Pasos de implementación (cuando se retome)

1. **Crear Storage Account + contenedor privado**:
   ```bash
   az storage account create -g paula-rg -n paulastorage -l eastus --sku Standard_LRS
   az storage container create --account-name paulastorage -n uploads --public-access off
   ```

2. **Obtener connection string** (secret `AZURE_STORAGE_CONNECTION_STRING`):
   ```bash
   az storage account show-connection-string -g paula-rg -n paulastorage
   ```

3. **Instalar SDK**:
   ```bash
   pnpm add @azure/storage-blob
   ```

4. **Módulo `storage`** (dos endpoints):
   - `POST /api/storage/upload-url` → genera SAS **write** con expiración corta y devuelve `uploadUrl` + `blobUrl`.
   - `POST /api/storage/confirm` → el cliente notifica fin de upload; el backend persiste metadata (`userId`, `blobName`, `size`, `contentType`).

5. **Generar SAS** (pseudocódigo de `storage.service.ts`):
   ```typescript
   import {
     BlobSASPermissions, BlobServiceClient,
     generateBlobSASQueryParameters, SASProtocol,
   } from '@azure/storage-blob';

   const svc = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
   const container = svc.getContainerClient('uploads');
   const blobName = `${userId}/${crypto.randomUUID()}-${filename}`;
   const blob = container.getBlobClient(blobName);

   const sas = generateBlobSASQueryParameters({
     containerName: 'uploads',
     blobName,
     permissions: BlobSASPermissions.parse('cw'),     // create + write
     startsOn: new Date(Date.now() - 60_000),
     expiresOn: new Date(Date.now() + 15 * 60_000),   // 15 min
     protocol: SASProtocol.Https,
   }, svc.credential).toString();

   return { uploadUrl: `${blob.url}?${sas}`, blobUrl: blob.url };
   ```

6. **Read SAS para descarga**: mismo patrón pero `BlobSASPermissions.parse('r')`, expiración al momento de servir (≤ 5 min).

7. **Seguridad**:
   - Contenedor **privado**.
   - SAS cortas (≤ 15 min write, ≤ 5 min read).
   - Forzar HTTPS (`SASProtocol.Https`).
   - Validar `contentType` y tamaño máximo en el endpoint de confirmación.
   - Nunca enviar al cliente la storage account key ni la connection string.

8. **Equivalencia con AWS S3** (por si se migra):
   | Azure Blob | AWS S3 |
   |------------|--------|
   | Storage Account | Bucket |
   | Container | (prefijo / subpath) |
   | SAS token | Presigned URL |
   | `@azure/storage-blob` | `@aws-sdk/s3-request-presigner` |
   | `generateBlobSASQueryParameters` | `getSignedUrl` |

9. **Alternativa sin SAS (no recomendada)**: cliente → backend → blob. Añade carga al server y dobla el ancho de banda. SAS evita ese costo.

### Estado actual
- ❌ No hay endpoints `/api/storage/*` en el código
- ❌ No hay módulo `storage/`
- ❌ `@azure/storage-blob` no está instalado
- ✅ Estructura del bounded context prevista
- ✅ Diagrama y pasos listos para exposición oral

---

## Licencia
MIT.
