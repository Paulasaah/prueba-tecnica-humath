# Prueba Técnica Humath · Backend

REST API construida en **Node.js + Express + TypeScript** que consume [Alpha Vantage](https://www.alphavantage.co/) y expone un endpoint propio con datos transformados. Incluye autenticación JWT, validación con Zod, cache en memoria, persistencia con TypeORM, documentación Swagger UI, tests con Jest, contenedor Docker y despliegue automatizado a Azure App Service.

## Qué hace el proyecto

Cumple el enunciado de la prueba: consume una API pública externa (Alpha Vantage), transforma la respuesta a un formato propio en JSON y la expone en un endpoint HTTP. Como plus, añade auth JWT, cache en memoria para respetar el rate-limit gratuito de Alpha Vantage, Swagger UI, logging estructurado con request IDs, validación de entrada con Zod, tests unitarios y CI/CD completo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20 LTS |
| Package manager | pnpm 9 (via corepack) |
| Framework | Express 5 |
| Lenguaje | TypeScript strict |
| Cliente HTTP externo | Axios (single instance con cache) |
| ORM | TypeORM |
| DB | PostgreSQL (Neon serverless en cloud, postgres:16 en local) |
| Auth | JWT + bcrypt |
| Validación | Zod |
| Logging | Pino + pino-http |
| Docs API | Swagger UI |
| Tests | Jest + ts-jest + supertest |
| Contenedor | Docker multi-stage (node:20-alpine) |
| CI/CD | GitHub Actions → Azure App Service for Containers |

## Cómo ejecutarlo localmente

### Opción A · Node directo

```bash
corepack enable && corepack prepare pnpm@9 --activate
pnpm install
cp .env.example .env
pnpm dev
```

Verificar:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/external-data
open http://localhost:3000/api/docs
```

### Opción B · Docker Compose (DB + API incluidas)

```bash
export ALPHA_VANTAGE_KEY=tu_api_key
export JWT_SECRET=$(openssl rand -hex 32)
docker compose up --build
```

## API externa consumida

[Alpha Vantage](https://www.alphavantage.co/documentation/) — datos financieros (quote, time-series, top movers). Plan gratuito: 5 req/min, 500 req/día. El cache en memoria (node-cache, TTL 60s) mitiga el rate-limit.

## Endpoints implementados

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness |
| GET | `/ready` | — | Readiness (chequea DB) |
| GET | `/api/docs` | — | Swagger UI |
| GET | `/external-data` | — | Endpoint del enunciado: top-movers transformados |
| POST | `/api/auth/register` | — | Registro de usuario |
| POST | `/api/auth/login` | — | Login, retorna JWT |
| GET | `/api/auth/me` | JWT | Perfil del usuario |
| GET | `/api/market/quote/:symbol` | JWT | Cotización (GLOBAL_QUOTE) |
| GET | `/api/market/daily/:symbol` | JWT | Serie diaria (TIME_SERIES_DAILY) |

### Ejemplo de respuesta de `/external-data`

```json
[
  { "id": 1, "name": "AAPL", "priceChange": 3.25, "changePercent": "1.2%" },
  { "id": 2, "name": "TSLA", "priceChange": 5.50, "changePercent": "2.5%" }
]
```

## Variables de entorno

Ver `.env.example`. Las mínimas:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DB_SSL=true
ALPHA_VANTAGE_KEY=tu_api_key
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co/query
JWT_SECRET=un_secreto_largo_y_aleatorio
BCRYPT_ROUNDS=12
```

## Arquitectura (separación por módulos)

```
src/
  common/
    database.ts          DataSource TypeORM
    errors.ts            Clases de error (AppError, NotFoundError, ...)
    error-handler.ts     Middleware global
    logger.ts            Pino
    cache.ts             node-cache
    http-client.ts       Axios wrapper (única instancia)
    validate.ts          Middleware Zod
    swagger.ts           OpenAPI 3.0 spec
  modules/
    auth/
      auth.entity.ts     User (TypeORM)
      auth.dto.ts        Zod schemas
      auth.service.ts    bcrypt + JWT
      auth.controller.ts Handlers HTTP
      auth.module.ts     Router Express
      jwt.middleware.ts  Guard JWT
    market/
      market.entity.ts   MarketQueryLog (auditoría)
      market.dto.ts      Zod schemas + DTOs
      market.service.ts  Consume Alpha Vantage + transforma
      market.controller.ts
      market.module.ts
  app.ts                 Setup Express
  index.ts               Entry point (bootstrap + graceful shutdown)
tests/
  *.spec.ts              Jest (mock-first)
```

## Testing

```bash
pnpm test
pnpm test:watch
```

Cubre: `AuthService` (register/login con JWT real), `MarketService` (transformación DTO + NotFoundError), endpoints `/health`, `/ready`, `/api/docs`.

## Docker

Multi-stage (`deps` → `build` → `runtime`) sobre `node:20-alpine`, usuario no-root, healthcheck integrado.

```bash
docker build -t prueba-tecnica-humath .
docker run -p 3000:3000 --env-file .env prueba-tecnica-humath
```

## Despliegue en Azure

Despliegue automático vía GitHub Actions → Azure App Service for Containers. El workflow `deploy-azure.yml` se dispara con push a `main`:

1. Build y test en runner Ubuntu.
2. Construye imagen Docker y la publica en GHCR (`ghcr.io/paulasaah/prueba-tecnica-humath`).
3. Deploya el contenedor a Azure Web App (`azure/webapps-deploy@v3`).
4. Smoke test contra `/health`.

### Setup único en Azure

```bash
az group create -n paula-rg -l eastus
az appservice plan create -g paula-rg -n paula-plan --is-linux --sku B1
az webapp create -g paula-rg -p paula-plan -n prueba-tecnica-humath \
  --deployment-container-image-name ghcr.io/paulasaah/prueba-tecnica-humath:latest

az webapp config appsettings set -g paula-rg -n prueba-tecnica-humath --settings \
  NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  ALPHA_VANTAGE_KEY="..." \
  JWT_SECRET="..." \
  WEBSITES_PORT=3000
```

### Secrets requeridos en GitHub

- `AZURE_APP_NAME` — nombre del Web App (`prueba-tecnica-humath`)
- `AZURE_PUBLISH_PROFILE` — publish profile descargado del portal Azure

### URL pública

`https://prueba-tecnica-humath.azurewebsites.net`

---

## Almacenamiento de archivos en Azure Blob + SAS (diseño, no implementado)

La prueba menciona "carga de archivos a un storage de Azure manejando SAS". Esta sección documenta el diseño sin implementarlo.

### Qué es SAS

Un Shared Access Signature es un token firmado que:

- Define qué operaciones permite (`read`, `write`, `create`, `delete`, `list`).
- Tiene expiración (5–15 min recomendado).
- Opcionalmente restringe por IP y protocolo (HTTPS).
- No expone la storage account key al cliente.

### Flujo de upload

```
[cliente]                  [backend]                      [Azure Blob]
    |                          |                                |
    |  1. POST /api/storage    |                                |
    |     /upload-url (JWT)    |                                |
    |------------------------->|                                |
    |                          | 2. generar SAS write           |
    |                          |    (15 min, solo write)        |
    |  3. { uploadUrl, blobUrl }                                |
    |<-------------------------|                                |
    |                                                           |
    |  4. PUT binario directo al blob firmado                   |
    |---------------------------------------------------------->|
    |                          |                                |
    |  5. POST /api/storage/confirm (blobUrl)                   |
    |------------------------->|                                |
    |                          | 6. persistir metadata DB       |
```

### Implementación (pseudocódigo)

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
  permissions: BlobSASPermissions.parse('cw'),
  startsOn: new Date(Date.now() - 60_000),
  expiresOn: new Date(Date.now() + 15 * 60_000),
  protocol: SASProtocol.Https,
}, svc.credential).toString();

return { uploadUrl: `${blob.url}?${sas}`, blobUrl: blob.url };
```

### Equivalencia AWS S3

| Azure Blob | AWS S3 |
|------------|--------|
| Storage Account | Bucket |
| Container | Prefijo/subpath |
| SAS token | Presigned URL |
| `@azure/storage-blob` | `@aws-sdk/s3-request-presigner` |

## Licencia

MIT.
