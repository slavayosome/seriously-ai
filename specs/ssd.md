# Seriously AI – System Specification Document

**Version 2.0** · **19 Jun 2025**

---

## 1. System Overview

Seriously AI is a credit-based, research-to-content platform that automates topic discovery, evidence-backed insight generation, and post drafting for solo professionals. It embraces an atomic content architecture—**Atoms** (API calls) → **Molecules** (jobs) → **Cells** (pipelines) → **Organism** (orchestrator)—to keep every operation composable, testable, and cost-metered.

The MVP focuses on three pipelines:

- **Basic Discovery + Insights** (5 credits): fetch top news on a prompt, distil 5-10 key insights with citations
- **Deep Discovery** (10 credits): larger corpus, richer embeddings, clustering, and advanced insight selection
- **Draft Generation** (1 credit): turn a saved insight bundle into four platform-ready drafts via templates

The vision is a headless backend (Supabase + Edge Functions) surfaced through a Next.js web app and, later, a Telegram bot.

---

## 2. Core Modules & Responsibilities

| # | Module | Layer | Key Responsibilities |
|---|--------|-------|---------------------|
| 1 | Web UI | Next.js | Prompt form, Insight Explorer, Draft Editor, Billing dashboard |
| 2 | Pipeline Orchestrator | Organism | Validate quota, enqueue pipeline, monitor status |
| 3 | Ingestion Worker | Molecule | Fetch RSS/HTML, clean text, deduplicate, store metadata |
| 4 | Embedding Service | Molecule | Generate & cache OpenAI embeddings, store in pgvector |
| 5 | Insight Generator | Molecule | Rank articles, extract top insights, package Research Report |
| 6 | Draft Generator | Molecule | Render drafts from insights + template via LLM |
| 7 | Knowledge Library API | Cell | CRUD Research Reports, vector search within user scope |
| 8 | Auth & RBAC | N/A | Supabase Auth, role & quota enforcement |
| 9 | Billing Engine | N/A | Stripe checkout, credit wallet management, webhooks |
| 10 | Connectors | N/A | Outbound posting (export, LinkedIn—post-MVP) |

---

## 3. Architecture Diagram (textual)

```
+-------------+            HTTPS           +-------------------+
|   Web UI    |  <───────>  Next.js API  <─>  Supabase (PG +   |
|  (Next.js)  |                           |  Storage + Auth)   |
+------+------+                           +-------+-----------+
       |                                           |
       | REST / WebSocket                          | SQL / RLS
       |                                           |
+------+-------+        Redis Stream        +------+-------+
|  Pipeline    |  <───────────────────────> |  Worker Pool |
| Orchestrator |                            |  (Vercel Fn) |
+--------------+                            +--------------+
```

All code lives in a Turborepo; CI/CD is Vercel-driven with preview URLs per PR.

---

## 4. Technology Stack

### 4.1 Frontend
- **Framework:** Next.js 14 (App Router, RSC) — instant SSR, Vercel-optimised
- **Styling:** Tailwind CSS — utility-first, tree-shaken

### 4.2 Backend
- **API Layer:** Next.js Route Handlers — collocated with UI for simplicity
- **Edge Functions:** Supabase + Vercel Cron — async jobs & scheduled clean-ups

### 4.3 Database
- **Primary Store:** Supabase Postgres (EU) with pgvector extension
- **TTL Policy:** Research Reports auto-expire after 180 days to control growth

### 4.4 Infrastructure / DevOps
- **Hosting:** Vercel (UI & light workers) + Supabase (DB, Auth, Storage)
- **Queue/Cache:** Upstash Redis (pay-per-request, Redis Streams)
- **CI/CD:** Vercel + Turborepo cache — push → build → preview
- **Monitoring:** Supabase Logs, Vercel Analytics; Sentry planned post-MVP

---

## 5. Data Strategy

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Research Report** | Structured result of a discovery pipeline | `id`, `user_id`, `summary_md`, `generated_at`, `topic`, `insight_count`, `articles_scanned` |
| **Insight** | Individual distilled statement | `id`, `report_id`, `content_md`, `citation_url`, `citation_title`, `embedding` |
| **Draft** | Platform-ready post | `id`, `user_id`, `insight_ids[]`, `template_id`, `content_md`, `version` |
| **Credit Wallet** | Tracks remaining credits per user | `user_id`, `balance`, `last_refill` |

Embeddings enable semantic search; no full article body is stored—only minimal citation metadata and a checksum for integrity.

---

## 6. Authentication & Authorization

- **Auth Provider:** Supabase Auth (magic-link & OAuth)
- **RBAC & Quotas:** Row-level security ensures data isolation; role table maps plan → monthly credit top-up & feature flags
- **Credit Enforcement:** Orchestrator debits wallet atomically before queueing a pipeline

---

## 7. External Integrations

| Service | Use | MVP? |
|---------|-----|------|
| **OpenAI API** | Embeddings & LLM completions | ✔ |
| **Stripe** | Subscription & credit wallet top-ups | ✔ |
| **LinkedIn API** | Direct post publishing | ✖ (export only) |
| **Segment / PostHog** | Product analytics | ✖ |

---

## 8. Scalability & Deployment

- **Traffic Spikes:** Vercel auto-scales SSR Lambdas; warm queue absorbs bursts
- **Worker Scale:** Increase concurrency via additional Vercel Cron instances; future migration to Fly.io if needed
- **Data Growth:** 180-day TTL + monthly cold-store dump keeps DB <5 GB in Year 1
- **Zero-Downtime:** Vercel previews → atomic promote ensure safe deploys
- **International:** DB region = EU; Edge Functions distributed; future multi-region read replicas optional

---

*End of Document*