# MES Backend

**MES Backend** is a high-performance, modular Manufacturing Execution System (MES) designed as a **DDD-aligned Modular Monolith**. It provides a robust, multi-tenant foundation for modern manufacturing environments, featuring integrated AI orchestration and strict traceability.

---

## 🚀 Quick Start (pnpm)

Ensure you have [Docker](https://www.docker.com/) and [pnpm](https://pnpm.io/) installed.

1.  **Clone the environment**:
    ```bash
    cp .env.example .env
    ```
2.  **Start Infrastructure** (Postgres, Redis, MinIO):
    ```bash
    docker compose up -d
    ```
3.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
4.  **Initialize Database** (Migrations + Permissions Seeding):
    ```bash
    pnpm prod:init
    ```
5.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) (v11.x) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (v5.9+) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (v15+) |
| **Cache & Jobs** | [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) |
| **Validation** | [Zod](https://zod.dev/) + `nestjs-zod` |
| **Storage** | [MinIO](https://min.io/) (S3 Compatible) |
| **AI** | [Google Gemini AI](https://ai.google.dev/) |

---

## ✨ Key Features

### 🧠 AI Vibe Coding Engine
A state-of-the-art Generative UI orchestrator that allows creation of custom dashboard pages via natural language. Uses a strictly sandboxed JSON-based protocol to ensure security and design consistency.

### 🛡️ Multi-Tenancy & Advanced RBAC
*   **Organization-Level Isolation**: All data is strictly scoped by `organizationId`.
*   **Resource-Scoped Policy**: Granular permissions (Read/Create/Update/Delete) defined at the resource level in `*.policy.ts`.
*   **Token Invalidation**: Immediate session termination upon role or permission changes via Redis.

### 📜 Global LogTraceability & Audit Trails
Every mutation on critical business entities (Work Orders, BOM, Materials) is automatically captured in a row-level audit trail, ensuring full compliance and accountability.

### 🏗️ Modular Monolith Architecture
*   **Bounded Contexts**: Feature-specific modules with isolated logic.
*   **Drizzle Relational Queries**: High-performance, type-safe SQL with automated migration management.
*   **Concurrency & Pessimistic Locking**: Integrated `.forUpdate()` support in transactions for high-frequency data consistency (e.g., scanners, PLC triggers).
*   **Response Wrapping**: Standardized `{ success, message, data }` responses for predictable API consumption.

### 🕒 Background Job Infrastructure
Robust async task processing using **BullMQ** and **Redis** for heavy operations like report generation, cleanup tasks, and AI processing.

### 🕵️ Vibe-Trace Protocol
A meta-level engineering audit system located in `.trace/`. Every architectural shift and AI session is documented to maintain a clear history of the codebase evolution.

---

## 📖 Documentation

*   **API Specs**: Swagger/OpenAPI documentation is available at `/api/docs` in development mode.
*   **Implementation Checklist**: See [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for architectural standards.
*   **MES Agent Protocol**: See [PROTOCOL.md](./PROTOCOL.md) for AI interaction guidelines.

---

## ⚖️ License & Ethics

This project is **source-available** and licensed under the **Non-Commercial Source-Available License**.

*   **Non-Commercial Usage**: Free to use, fork, and modify for internal or experimental purposes.
*   **Commercial Usage**: Requires a separate license. Contact the project owner for enterprise deployments or SaaS offerings.

---

## 🟡 Project Status

Active Development. The project is evolving rapidly into a production-grade MES foundation.
