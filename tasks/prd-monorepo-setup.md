# Product Requirements Document: Seriously AI Monorepo Setup (Simplified)

## Introduction/Overview

This PRD defines the minimal requirements for setting up the Seriously AI monorepo structure. The goal is to create a working foundation that can be built upon incrementally, focusing on getting started quickly rather than perfection.

## Goals

1. **Create the basic monorepo structure** with Turborepo and pnpm
2. **Set up a working Next.js app** with minimal boilerplate
3. **Enable code sharing** between packages
4. **Configure TypeScript** with path aliases
5. **Add basic linting** with ESLint and Prettier

## User Stories

1. **As a developer**, I want to clone the repo and start developing in under 5 minutes.
2. **As a developer**, I want to share types between the frontend and backend.
3. **As a developer**, I want TypeScript and linting configured out of the box.

## Functional Requirements

### 1. Monorepo Structure

The system must create this directory structure:
```
seriously-ai/
├── apps/
│   └── web/                    # Next.js 14 app
├── packages/
│   └── shared/                 # Shared types and utils
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── tsconfig.json              # Base TypeScript config
├── .eslintrc.js               # ESLint config
├── .prettierrc                # Prettier config
├── .gitignore
├── .env.example               # Example environment variables
└── README.md                  # Basic setup instructions
```

### 2. Core Setup

2.1. **Package Manager & Monorepo Tool**
   - Initialize with pnpm
   - Configure Turborepo with basic `dev`, `build`, and `lint` commands
   - Set up pnpm workspace configuration

2.2. **Next.js App (apps/web)**
   - Create Next.js 14 app with App Router
   - Add a simple homepage
   - Configure to use the shared package
   - Include TailwindCSS

2.3. **Shared Package (packages/shared)**
   - Create basic TypeScript types (User, Insight)
   - Add one utility function (formatDate)
   - Configure proper exports in package.json

2.4. **TypeScript Configuration**
   - Base tsconfig.json in root
   - Path aliases: `@/components` for Next.js, `@seriously-ai/shared` for shared package
   - Strict mode enabled

2.5. **Linting**
   - Basic ESLint setup for TypeScript
   - Prettier for formatting
   - Scripts in package.json for running lint/format

### 3. Environment Variables

Create `.env.example` with placeholders for:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 4. Basic Documentation

README.md must include:
- Prerequisites (Node.js 18+, pnpm)
- Quick start commands:
  ```bash
  pnpm install
  pnpm dev
  ```
- Basic project structure explanation
- Where to add environment variables

## Non-Goals (Out of Scope)

1. Workers, services, and Python scripts - add these later as needed
2. Authentication implementation - just environment variables for now
3. Testing setup - can be added when you have something to test
4. CI/CD and Git hooks - add when you have a team
5. Complex UI components - just basic Next.js pages

## Success Metrics

1. **Setup Time**: Developer can go from clone to running locally in under 5 minutes
2. **Simplicity**: Everything works with just `pnpm install` and `pnpm dev`
3. **Type Safety**: TypeScript configured and working across packages

---

*This simplified PRD focuses on getting the essential monorepo structure working quickly. You can incrementally add more complexity as the project grows.* 