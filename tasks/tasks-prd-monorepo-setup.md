# Tasks: Seriously AI Monorepo Setup

## Relevant Files

- `package.json` - Root package.json with pnpm workspace configuration and scripts ✅
- `pnpm-workspace.yaml` - pnpm workspace configuration file ✅
- `turbo.json` - Turborepo pipeline configuration ✅
- `tsconfig.json` - Base TypeScript configuration with path aliases ✅
- `.eslintrc.js` - ESLint configuration for TypeScript and Next.js ✅
- `.prettierrc` - Prettier formatting configuration ✅
- `.gitignore` - Git ignore patterns for Node.js and Next.js ✅
- `.env.example` - Example environment variables template ✅
- `README.md` - Project setup and development instructions ✅
- `apps/web/package.json` - Next.js application package configuration ✅
- `apps/web/next.config.js` - Next.js configuration for monorepo and TypeScript paths ✅
- `apps/web/tailwind.config.js` - TailwindCSS configuration ✅
- `apps/web/tsconfig.json` - TypeScript config extending base config ✅
- `apps/web/app/layout.tsx` - Next.js App Router root layout ✅
- `apps/web/app/page.tsx` - Homepage component ✅
- `packages/shared/package.json` - Shared package configuration with proper exports ✅
- `packages/shared/tsconfig.json` - TypeScript config for shared package ✅
- `packages/shared/src/types/index.ts` - Exported TypeScript interfaces (User, Insight) ✅
- `packages/shared/src/utils/index.ts` - Exported utility functions (formatDate) ✅
- `packages/shared/src/index.ts` - Main entry point re-exporting types and utils ✅

### Notes

- No test files are included in this initial setup as per the PRD's simplified scope
- Focus is on getting a working foundation that can be extended later
- All configuration files should enable strict TypeScript checking

## Tasks

- [x] 1.0 Initialize Monorepo Structure and Package Management
  - [x] 1.1 Create root directory structure (apps/, packages/, config files)
  - [x] 1.2 Initialize git repository with `git init`
  - [x] 1.3 Create root package.json with pnpm workspace configuration and scripts
  - [x] 1.4 Create pnpm-workspace.yaml defining workspace packages
  - [x] 1.5 Install pnpm globally and run `pnpm install` to verify workspace setup

- [x] 2.0 Configure TypeScript and Build Tools
  - [x] 2.1 Create base tsconfig.json with strict mode and path aliases (@/*, @seriously-ai/shared)
  - [x] 2.2 Create .eslintrc.js with TypeScript and Next.js rules
  - [x] 2.3 Create .prettierrc with consistent formatting rules
  - [x] 2.4 Create turbo.json with pipeline tasks (dev, build, lint)
  - [x] 2.5 Add lint and format scripts to root package.json

- [x] 3.0 Create Next.js Application with TailwindCSS
  - [x] 3.1 Create apps/web directory and initialize Next.js 14 with App Router
  - [x] 3.2 Create apps/web/package.json with Next.js dependencies
  - [x] 3.3 Configure next.config.js for monorepo transpilation and TypeScript paths
  - [x] 3.4 Set up TailwindCSS with tailwind.config.js and globals.css
  - [x] 3.5 Create apps/web/tsconfig.json extending base config
  - [x] 3.6 Create basic homepage (app/page.tsx) with Seriously AI branding
  - [x] 3.7 Create root layout (app/layout.tsx) with TailwindCSS imports

- [x] 4.0 Set up Shared Package with Types and Utilities
  - [x] 4.1 Create packages/shared directory structure (src/types/, src/utils/)
  - [x] 4.2 Create packages/shared/package.json with proper name and exports configuration
  - [x] 4.3 Create packages/shared/tsconfig.json extending base config
  - [x] 4.4 Create TypeScript interfaces in src/types/index.ts (User, Insight)
  - [x] 4.5 Create formatDate utility function in src/utils/index.ts
  - [x] 4.6 Create main entry point src/index.ts re-exporting types and utils
  - [x] 4.7 Test shared package usage by importing in Next.js app

- [x] 5.0 Create Documentation and Environment Configuration
  - [x] 5.1 Create comprehensive .gitignore for Node.js, Next.js, and IDE files
  - [x] 5.2 Create .env.example with Supabase and OpenAI placeholder variables
  - [x] 5.3 Create README.md with prerequisites, quick start commands, and project structure
  - [x] 5.4 Document where to add environment variables and basic development workflow
  - [x] 5.5 Verify entire setup works with `pnpm install` and `pnpm dev` 