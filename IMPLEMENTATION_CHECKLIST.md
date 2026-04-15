# MES Backend — AI Agent Implementation Checklist

> **Purpose**: This is the mandatory pre-flight + execution checklist for every task delegated to an AI agent on the `mes-backend` NestJS codebase. No task is considered complete until every applicable section is verified. Read this **in full** before writing a single line of code.

---

## 0. Codebase DNA (Read-Only Reference — Never Deviate)

### Tech Stack

| Layer            | Technology                         | Version (approx.) |
| ---------------- | ---------------------------------- | ----------------- |
| Runtime          | Node.js + TypeScript               | TS 5.9            |
| Framework        | NestJS                             | 11.x              |
| ORM              | Drizzle ORM                        | 0.45              |
| DB               | PostgreSQL (via `pg` pool)         | ≥14               |
| Cache / Sessions | Redis (`ioredis`)                  | 5.x               |
| Background Jobs  | BullMQ (with Redis)                | —                 |
| Validation       | Zod +`nestjs-zod`                  | zod 4.x           |
| Auth             | JWT + Passport (`passport-jwt`)    | —                 |
| Storage          | MinIO                              | `minio` 8.x       |
| Mail             | Nodemailer + Handlebars templates  | —                 |
| CI/CD            | GitLab CI → Podman → systemd       | —                 |
| Package mgr      | **pnpm only** (`preinstall` guard) | —                 |

### Project Conventions You MUST Follow

- **Module pattern**: `module.ts` / `controller.ts` / `service.ts` / `decorators.ts` / `dto.ts` / `policy.ts` in each feature directory.
- **Path aliases**: Always use `@/` imports (e.g., `@/common/permissions`, `@/models/schema`). Never use relative `../../` imports unless inside the same directory.
- **Response wrapping**: Always return `ok(data).message('...')` from controllers. Never return raw objects. The `ResponseInterceptor` wraps it into `{ success, message, data }`.
- **DTOs**: Use `createStrictZodDto()` for request DTOs, `createZodDto()` for response DTOs. Never use `class-validator` — only Zod.
- **Global validation pipe**: `nestjs-zod`'s `createZodValidationPipe` is global. It will validate all request/response Zod schemas automatically. Broken response shape = 422.
- **Error exceptions**: Use NestJS exceptions (`BadRequestException`, `NotFoundException`, etc.). Never throw raw `Error` objects from controllers or services.
- **No `any`**: Strictly avoid `any` types unless wrapping Drizzle internals or legacy code paths that already use it. Document why if forced.
- **No `process.env` directly in service/controller code**: Always use `ConfigService`. The one exception is `auth.service.ts` in `forgotPassword` (known tech debt — do NOT copy this pattern).
- **Drizzle transactions**: Use `tx` parameter for any multi-table write. Never do partial writes outside a transaction.
- **Soft delete pattern**: `deletedAt` field is the gate. Always filter `isNull(schema.table.deletedAt)` unless intentionally querying deleted records.
- **Migrations**: Never edit existing `.sql` migration files. Always generate new ones via `pnpm db:generate`.
- **Commit messages**: Follow Conventional Commits format (enforced by `commitlint.config.js` + Husky).

---

## 1. Pre-Implementation Checklist (Before Writing Code)

### 1.1 Understand Scope

- [ ] Read the task description completely. Clarify any ambiguity before touching any file.
- [ ] Identify which **modules** are affected (e.g., `users`, `roles`, `auth`, `ticket`, etc.).
- [ ] Identify which **schema tables** are affected and whether a migration is needed.
- [ ] Identify which **permissions** are affected (see `src/common/permissions.ts`).
- [ ] Identify **cross-module dependencies** (e.g., `RolesService` used in `AuthService`, `UsersService` in `RolesService` via `forwardRef`).

### 1.2 Check Existing Patterns First

- [ ] Search for an existing similar implementation (e.g., another module's controller/service pair) before writing a new one.
- [ ] Check if `BasePolicy` covers your RBAC needs before writing custom permission logic.
- [ ] Check if `BaseFilterableService` covers your list/filter/paginate needs.
- [ ] Check if the `FilterService` supports your filter operators before building custom SQL.
- [ ] Check `src/common/helpers/validations.ts` for existing regex patterns before defining new ones.

### 1.3 Schema Analysis

- [ ] Read the relevant `*.schema.ts` files to understand column names, types, constraints, and FK relationships.
- [ ] Read `src/models/schema/relations.ts` to understand Drizzle relational query setup.
- [ ] Determine if existing columns satisfy the requirement or if schema change is needed.
- [ ] If schema change is needed: generate a new migration (`pnpm db:generate`), never edit existing ones.
- [ ] Verify column naming: DB uses `snake_case` (e.g., `factory_id`), TypeScript uses `camelCase` (e.g., `organizationId`).

---

## 2. Schema & Database Checklist

- [ ] New tables follow the standard shape: `id` (uuid, defaultRandom, PK [Primary Key]), `createdAt`, `updatedAt`, `deletedAt` (nullable, soft-delete gate).
- [ ] All FK [Foreign Key] references include `onDelete` behavior (`cascade`, `set null`, or `restrict`).
- [ ] All indexes are defined in the table's second argument callback array.
- [ ] Unique constraints use `unique(...)`, case-insensitive email uniqueness uses `uniqueIndex(...).on(sql\`lower(${table.email})\`)`.
- [ ] Multi-column unique constraints (e.g., `role_name_org_idx` on `(name, organizationId)`) are defined.
- [ ] After schema change: run `pnpm db:generate` -> inspect the generated `.sql` -> `pnpm db:migrate`.
- [ ] If adding permissions: update `src/common/permissions.ts` AND `src/models/seeder/permission-seeder.service.ts` AND run `pnpm db:seed-permissions` in prod.
- [ ] Relations in `src/models/schema/relations.ts` are updated to reflect new FK links.
- [ ] Zod schemas in `src/models/zod-schemas/index.ts` are updated if new table added.
- [ ] **Audit & Traceability**: Critical business entities (Work Orders, BOM, execution data) MUST have a corresponding audit trail in the `LogTraceability` model or dedicated audit table.

---

## 3. Module Architecture Checklist

Every feature module MUST contain these files:

```
src/modules/<feature>/
  ├── <feature>.module.ts       ← NestJS @Module, imports, providers, exports
  ├── <feature>.controller.ts   ← HTTP endpoints, guards, uses ok() builder
  ├── <feature>.service.ts      ← Business logic, DB queries, throws NestJS exceptions
  ├── <feature>.dto.ts          ← Zod schemas → createStrictZodDto classes (request) + response DTOs
  ├── <feature>.decorators.ts   ← applyDecorators bundles per endpoint key (guards, ZodResponse, ApiOperation)
  └── <feature>.policy.ts       ← extends BasePolicy<TTable>, resource-scoped RBAC SQL
```

- [ ] Module file imports and exports are complete (no missing providers).
- [ ] Circular dependency resolved with `forwardRef()` if needed (check existing usage in `UsersModule`/`AttachmentModule`).
- [ ] `CustomLoggerService` is injected and `this.logger.setContext(ClassName.name)` called in constructor.
- [ ] Service extends `BaseFilterableService` if it has a list/filter endpoint.

---

## 4. Controller Checklist

- [ ] Controller uses `@ApiTags(...)` and `@ApiBearerAuth()` at class level.
- [ ] Every route is decorated via the module's `XxxDecorators('endpointKey')` function in `<feature>.decorators.ts` — never inline guards/swagger decorators in the controller itself.
- [ ] Authentication: `UseGuards(JwtAuthGuard)` is always the first guard.
- [ ] Authorization: `UseGuards(JwtAuthGuard, PermissionGuard)` + `RequiresPermissions(Permissions.xxx.yyy)` for protected routes.
- [ ] `@CurrentUser() user: JwtUser` parameter is used where user context is needed.
- [ ] Route returns `ok(data).message('...')` — never raw objects.
- [ ] Pagination responses: `ok(result.data).message('...').paginate({ total, page, limit })`.
- [ ] **Swagger Coverage**: Entire API surface (all requests, validation rules, possible responses, and schemas) must be fully documented using Swagger decorators.
- [ ] Manual ownership checks in controller (e.g., `userId !== reqUser.id && !reqUser.permissions.includes(...)`) are kept for business logic not expressible in policy SQL.
- [ ] HTTP verbs are semantically correct: `GET` read, `POST` create, `PUT` full update, `PATCH` partial update, `DELETE` remove.

---

## 5. Service Checklist

- [ ] Service NEVER directly accesses `process.env`. Use injected `ConfigService`.
- [ ] All DB operations go through `this.db` (assigned from `drizzle.database` in constructor).
- [ ] Multi-table writes are wrapped in `this.db.transaction(async (tx) => { ... })`.
- [ ] After role permission changes: call `this.rolesService.setPermissionToken(roleId)` to sync Redis cache.
- [ ] After user role assignment: emit `this.eventEmitter.emit('auth.roleChanged', { userId })` to invalidate tokens.
- [ ] `findOne` / `findByEmail` style methods always include `innerJoin(roles, ...)` + `leftJoin(organization, ...)` to satisfy `PublicUserOutput` schema shape.
- [ ] Response shape always matches the Zod schema declared in `dto.ts`. Any mismatch will cause a 422 from `ZodSerializerInterceptor`.
- [ ] Soft-delete queries: always filter `isNull(schema.table.deletedAt)` unless intentional.
- [ ] Multi-tenant isolation: queries are scoped by `organizationId` wherever applicable.
- [ ] `NotFoundException` is used when resource doesn't exist (not `null` returns from controller).
- [ ] `ConflictException` for duplicates (especially email/unique constraint violations).
- [ ] DB constraint error codes are caught and mapped: `23505` → `ConflictException`.
- [ ] **Concurrency & Locking**: For high-frequency data (PLC triggers, scanners), use pessimistic locking with `.forUpdate()` inside transactions to prevent race conditions.
- [ ] **Background Jobs**: Long-running tasks (heavy reports, MinIO batch processing) MUST be offloaded to BullMQ workers.
- [ ] **Traceability Logging**: Every entity mutation (create/update/delete) must invoke the traceability service to log "who changed what" at the row level.
- [ ] Error propagation: never swallow exceptions silently. Log them with `this.logger.error(...)`.

---

## 6. DTO & Validation Checklist

### Request DTOs

- [ ] Use `createStrictZodDto(schema)` for all request DTOs.
- [ ] XSS protection: all text fields use `validateText(...)` from `@/common/helpers/validations.ts` which runs `detectScriptInjection`.
- [ ] Password fields: use `passwordRegex` pattern (requires uppercase, lowercase, digit).
- [ ] Email fields: use `z.email(...)` (Zod 4 native).
- [ ] UUID fields: use `z.string().uuid(...)`.
- [ ] Name fields: use `validateText({ regex: nameRegex })` for user-facing names.
- [ ] No unknown fields accepted: `createStrictZodDto` strips / rejects unrecognized keys.
- [ ] Optional vs required fields: use `.optional()` or `validateText({ isOptional: true })`.

### Response DTOs

- [ ] One response DTO per endpoint type: single item `createApiResponseSchema(entitySchema)`, list `createApiPaginatedResponseSchema(entitySchema)`.
- [ ] **Swagger Decorators**: Every field in a Response DTO must have an `@ApiProperty()` decorator with exhaustive documentation (description, example, type).
- [ ] Response DTO is registered via `ZodResponse({ status: 200, type: XxxApiResponseDto })` in the decorator.
- [ ] `publicUserSelectSchema` is used for user responses (omits `password`, `verificationToken`, `deletedAt`, adds `role`, `organization`, `avatarUrl`).
- [ ] Never expose `password` or `verificationToken` fields in any response shape.

---

## 7. Security Checklist

- [ ] **JWT**: Tokens stored in Redis (`token:{userId}`). JwtStrategy validates against Redis before trusting token — so invalidation is immediate on logout/role change.
- [ ] **Password hashing**: Always `bcrypt.hash(password, 10)`. Never store plaintext.
- [ ] **Timing-safe comparison**: Use `crypto.timingSafeEqual` (already available via `constantTimeStringCompare` in AuthService) for OTP/code comparisons.
- [ ] **Artificial delays**: Apply `artificialDelay(200)` on failed login / password mismatch to prevent timing attacks.
- [ ] **User enumeration prevention**: Always return the same generic response for forgot-password, resend verification, etc., regardless of whether user exists.
- [ ] **Multi-tenant isolation**: Every query that reads/writes org-scoped data MUST filter by `organizationId`. Cross-org access should throw `ForbiddenException`.
- [ ] **CORS**: Origins validated in `main.ts`. Don't add blanket wildcards. Extend the `origins` array via ConfigService if needed.
- [ ] **Security headers**: Applied via `SecurityHeadersMiddleware` globally. Don't bypass it.
- [ ] **Rate limiting**: Use `RateLimitGuard` or `EnhancedRateLimitGuard` on public endpoints that can be brute-forced (login, resend verification, etc.).
- [ ] **Permission guard**: `PermissionGuard.covers()` enforces strict matching. Only permissions declared in `src/common/permissions.ts` are recognized. Typos → silent deny.
- [ ] **Input sanitization**: All user text through `detectScriptInjection()` regex checks.
- [ ] **Secret management**: Secrets come from `.env` via `ConfigService`. Never hardcode secrets or tokens.
- [ ] **Production builds**: Swagger is disabled in production (enforced in `main.ts`).
- [ ] **Error messages**: `HttpExceptionFilter` exposes `details` only in non-production. Production returns minimal error info.

---

## 8. RBAC & Policy Checklist

- [ ] New resource: add permission keys to `src/common/permissions.ts` (both `Permissions` const and `PermissionDescriptions` record).
- [ ] New permissions: add seeder entry to `permission-seeder.service.ts`.
- [ ] Policy class extends `BasePolicy<TTable>` with correct `table`, `resource`, `owner` options.
- [ ] **Organization Isolation**: Policy classes for multi-tenant resources MUST override `readOverride`, `updateOverride`, and `deleteOverride` to compare `user.organizationId` against the resource's `organizationId` (do NOT rely on `BasePolicy` defaults which compare against `user.id`).
- [ ] **Super Admin Bypass**: Inside override functions, use `if (this.hasAll(user, 'action')) return andAll(TRUE, ...extra);` to allow super admin type users to bypass tenant restrictions.
- [ ] Owner-scoped read: override `readExtra()` if additional OR scopes exist (e.g., ticket quotation).
- [ ] Admin bypass: `resource.action.all` covers any scoped `resource.action` automatically.
- [ ] `isAdmin` flag on roles: used in `getAdmin()` — the org owner role. Never create a second admin role.
- [ ] `isDefault` flag: the fallback role for invited users. Never delete it.
- [ ] System roles (`organizationId IS NULL`): cannot be modified or deleted. Enforced in `RolesService.updateDetails/delete`.
- [ ] Custom roles (`organizationId IS NOT NULL`): org-scoped, can be modified/deleted if no active users assigned.

---

## 9. Event System Checklist

- [ ] Role change → logout: `eventEmitter.emit('auth.roleChanged', { userId })` in `RolesService`.
- [ ] Auth listener (`auth.listener.ts`) handles `auth.roleChanged` by deleting Redis tokens.
- [ ] When adding new events: define event name constant, register listener via `@OnEvent(...)` decorator.
- [ ] `EventEmitterModule.forRoot()` is imported in `AppModule`. Standalone scripts must import it manually too.

---

## 10. Mail & Notifications Checklist

- [ ] All email sending goes through `MailService`.
- [ ] All URLs in emails (reset link, invitation link, etc.) must be built using `ConfigService` → `configuration.client.url`. Never use `process.env.CLIENT_*` directly.
- [ ] Templates live in `assets/` as `.hbs` Handlebars files.
- [ ] Email data objects must be fully populated before calling `mailService.send*()`. Check inviter name fallback logic in `UsersService.inviteUser`.

---

## 11. FilterableService / Pagination Checklist

- [ ] List endpoints extend `BaseFilterableService` and call `this.filterable(this.db, table, opts)`.
- [ ] Chain: `.where(...)` → `.filter(query)` → `.join(...)` → `.orderByFromQuery(...)` → `.paginate(query)` → `.select()` or `.selectFields({...})`.
- [ ] **No-Heavy-Joins Rule**: List/analytics endpoints must avoid excessive or deeply nested joins. Use flat structures or optimized subqueries where possible to ensure high performance.
- [ ] Response includes `{ data, total, page, limit }` before being wrapped by controller.
- [ ] `PaginatedFilterQueryDto` is the standard query parameter DTO for list endpoints.
- [ ] When joining tables via `selectFields({...})`, always alias nested table columns (e.g., `role: getTableColumns(Schema.roles)`).

---

## 12. Testing Checklist

- [ ] Unit tests: Jest with `@swc/jest` transformer (`jest.config.cjs`). All service-level business logic must have unit tests.
- [ ] Integration tests: `jest.integration.config.ts` with `@electric-sql/pglite` for real DB testing without a running Postgres.
- [ ] E2E tests: `jest.e2e.config.ts` using `supertest`.
- [ ] Mock heavy dependencies: `MailService`, `RedisService`, `StorageService` — always mock in unit tests.
- [ ] Test must cover: happy path, not-found, forbidden, validation failure, and conflict cases.
- [ ] Run `pnpm test` (unit) and `pnpm test:integration` before marking any task done.

---

## 13. CI/CD & DevOps Checklist

- [ ] **Lint**: `pnpm lint` must pass with zero errors before commit.
- [ ] **Format**: `pnpm format` (Prettier with import sorting via `@ianvs/prettier-plugin-sort-imports`).
- [ ] **Build**: `pnpm build` must succeed. Fixes any TS compilation errors.
- [ ] **GitLab CI stages**: `build_app` → `build_image` → `deploy`. Only protected branches trigger `build_image` and `deploy`.
- [ ] **Container**: `Containerfile.prod` for main branch, `Containerfile.dev` for dev branch.
- [ ] **DB migrations at deploy**: run in a one-shot container via `pnpm db:migrate` (see commented-out deploy script — consult team before enabling).
- [ ] **Changelog**: `pnpm changelog:generate` runs non-blocking during build.
- [ ] **Secrets in env**: Docker/Podman reads `.env` from deploy directory — never bake secrets into the image.

---

## 14. Code Quality Red Lines (These Are Non-Negotiable)

> Violations of these rules are grounds for instant rejection.

- ❌ **No `process.env` in service/controller** — use `ConfigService`.
- ❌ **No raw object responses from controllers** — always `ok(data).message(...)`.
- ❌ **No relative `../../` imports across module boundaries** — always use `@/` aliases.
- ❌ **No naked `any` types** — use precise types or generics.
- ❌ **No mutations outside transactions** — multi-table writes must use `tx`.
- ❌ **No missing `deletedAt` filter** — soft-delete pattern must be enforced in all list/find queries.
- ❌ **No hardcoded secrets or tokens** — always via ConfigService / environment.
- ❌ **No new permissions without updating the seeder** — the seeder is the source of truth for DB permissions.
- ❌ **No direct `class-validator` usage** — only Zod validation.
- ❌ **No `npm` or `yarn`** — only `pnpm` (guarded by `preinstall` hook).
- ❌ **No editing existing migration files** — generate new ones.
- ❌ **No system role modification** — `organizationId IS NULL` roles are immutable.
- ❌ **No mutations without audit logs** — core entity changes must be traceable.
- ❌ **No undocumented API response fields** — missing `@ApiProperty()` on DTOs.
- ❌ **No "heavy-joins" in list endpoints** — violates performance standard for data analysts.
- ❌ **No silent exception swallowing** — always log and rethrow or map to NestJS exception.

---

## 15. Execution Workflow (Step-by-Step)

```
1. [ ] Read full checklist
2. [ ] Identify scope: modules, tables, permissions affected
3. [ ] Check existing patterns (don't reinvent)
4. [ ] Schema: update if needed → generate migration → inspect SQL
5. [ ] Permissions: update permissions.ts + seeder if needed
6. [ ] DTO: define request Zod schemas → createStrictZodDto → response schemas → ZodResponse
7. [ ] Policy: extend BasePolicy for new resource (or update existing)
8. [ ] Service: implement business logic with proper error handling + txn hygiene
9. [ ] Controller: wire decorators → call service → return ok()
10. [ ] Module: register all providers/controllers/exports
11. [ ] Tests: unit tests for service, integration if schema changed
12. [ ] Lint + format + build locally
13. [ ] Commit using Conventional Commits format
```

---

## 16. Known Tech Debt (Do NOT Copy These Patterns)

| Location                  | Issue                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.ts:328-330` | Direct `process.env.CLIENT_*` usage in `forgotPassword` instead of ConfigService                                          |
| `roles.service.ts:357`    | Error message typo:`'rules in use by active user'` (should be `'role is in use by active user'`)                          |
| `users.schema.ts:26`      | Column `factory_id` maps to `organizationId` — naming inconsistency from legacy                                           |
| `auth.service.ts:41`      | `private db;` declared separately from assignment — minor style inconsistency                                             |
| `model.service.ts:39`     | `logger.log('type', typeof this.db)` — debug log left in production path                                                  |
| `enums.ts`                | Uses `\r\n` line endings (CRLF) — inconsistent with rest of codebase (LF)                                                 |
| `roles.service.ts:297`    | Hard guard `if (!newPermissionIds.length)` — empty array = full permission removal is silently blocked instead of allowed |

---

## 17. Quick Reference — Key Files

| File                                              | Purpose                                                        |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `src/common/permissions.ts`                       | Master permission declaration + descriptions                   |
| `src/common/base.policy.ts`                       | RBAC SQL generator base class                                  |
| `src/common/helpers/validations.ts`               | Zod validation helpers + XSS patterns                          |
| `src/common/helpers/api-response.ts`              | `createApiResponseSchema` / `createApiPaginatedResponseSchema` |
| `src/common/interceptors/response.interceptor.ts` | Global response shaper                                         |
| `src/models/schema/index.ts`                      | Unified schema barrel export                                   |
| `src/models/schema/relations.ts`                  | Drizzle relational config                                      |
| `src/models/zod-schemas/index.ts`                 | All Zod entity schemas + types                                 |
| `src/models/seeder/permission-seeder.service.ts`  | DB permission seeder (runs on app start)                       |
| `src/app/exceptions.filter.ts`                    | Global HTTP exception formatter                                |
| `src/modules/auth/guards/jwt-auth.guard.ts`       | JWT token validation + Redis check                             |
| `src/modules/auth/guards/permission.guard.ts`     | RBAC permission enforcement                                    |
| `src/modules/auth/strategies/jwt.strategy.ts`     | JWT payload → user context + permissions from Redis            |
| `src/utils/index.ts`                              | `ok()`, `OkResponseBuilder`, `flattenPermissions`              |
| `src/config/server.config.ts`                     | App configuration interface +`IAppConfiguration`               |

---

## 18. Vibe-Trace Protocol (Meta-Level Engineering Audit)

Every AI agent session MUST conclude by recording a concise summary of the "vibe coding" session in the `.trace/` directory.

- **Rule**: Create a new `.md` file in `.trace/` named `YYYY-MM-DD-short-description.md`.
- **Content**:
    - **Date and Location**: Date, time, location, timezone. (e.g., 2026-04-15 15:44 Turkey +3:00GMT)
    - **Agent**: Your name + AI Tool - AI Model (e.g., Amin Abbasi - Antigravity - Gemini 3.0 Flash).
    - **Context**: Brief bullet points of the task.
    - **Architectural Shift**: Did you change how a module works? Document it here.
    - **Vibes**: A short, informal note on the session's progress or blockers.
- **Gate**: No task is closed until the `.trace` entry is committed and verified.
