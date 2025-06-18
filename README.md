# Seriously AI

> An AI-powered platform for generating actionable business insights that help you make data-driven decisions with confidence.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v8.0.0 or higher) - [Installation Guide](https://pnpm.io/installation)
- **Git** - [Installation Guide](https://git-scm.com/downloads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/seriously-ai/seriously-ai.git
   cd seriously-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

This is a monorepo built with [Turborepo](https://turbo.build/) and [pnpm workspaces](https://pnpm.io/workspaces).

```
serious-ai/
├── apps/
│   └── web/                    # Next.js 14 web application
│       ├── app/               # Next.js App Router
│       ├── src/               # Source code
│       ├── public/            # Static assets
│       ├── next.config.js     # Next.js configuration
│       ├── tailwind.config.js # TailwindCSS configuration
│       └── package.json       # Web app dependencies
│
├── packages/
│   └── shared/                # Shared utilities and types
│       ├── src/
│       │   ├── types/         # TypeScript interfaces
│       │   ├── utils/         # Utility functions
│       │   └── index.ts       # Main entry point
│       ├── dist/              # Built package (generated)
│       ├── tsconfig.json      # TypeScript configuration
│       └── package.json       # Shared package configuration
│
├── specs/                     # Project specifications
├── tasks/                     # Development tasks and documentation
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .gitignore                # Git ignore patterns
├── turbo.json                # Turborepo configuration
├── tsconfig.json             # Base TypeScript configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── package.json              # Root package configuration
└── README.md                 # This file
```

## 🛠 Available Scripts

### Root Level Commands

```bash
# Development
pnpm dev          # Start all applications in development mode
pnpm build        # Build all applications and packages
pnpm lint         # Lint all packages
pnpm lint:fix     # Fix linting issues automatically
pnpm format       # Format code with Prettier
pnpm type-check   # Run TypeScript type checking
pnpm clean        # Clean all build outputs

# Package-specific commands
pnpm dev --filter=@seriously-ai/web    # Start only the web app
pnpm build --filter=@seriously-ai/shared  # Build only the shared package
```

### Web Application (apps/web)

```bash
cd apps/web
pnpm dev         # Start development server
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Lint the web application
```

### Shared Package (packages/shared)

```bash
cd packages/shared
pnpm build       # Build the shared package
pnpm dev         # Build in watch mode
pnpm type-check  # Type check the package
```

## 🧰 Technology Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework

### Development Tools
- **[Turborepo](https://turbo.build/)** - High-performance build system
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[tsup](https://tsup.egoist.dev/)** - TypeScript bundler

### Planned Integrations
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **[OpenAI](https://openai.com/)** - AI/ML capabilities
- **[Stripe](https://stripe.com/)** - Payment processing
- **[Vercel](https://vercel.com/)** - Deployment platform

## 🌟 Features

### Current Features
- ✅ **Modern Monorepo Setup** - Turborepo with pnpm workspaces
- ✅ **Next.js 14 with App Router** - Latest React patterns
- ✅ **TypeScript Throughout** - Type safety across all packages
- ✅ **Shared Package System** - Reusable types and utilities
- ✅ **Beautiful UI** - TailwindCSS with custom design system
- ✅ **Developer Experience** - ESLint, Prettier, and hot reload

### Planned Features
- 🔄 **AI-Powered Insights** - Generate business insights from data
- 🔄 **Real-time Analytics** - Live data visualization
- 🔄 **User Authentication** - Secure user management
- 🔄 **Subscription Billing** - Stripe integration for SaaS model
- 🔄 **Data Integrations** - Connect to popular business tools

## 📝 Development Workflow

### Daily Development Process

1. **Start your development session**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install any new dependencies
   pnpm install
   
   # Start development servers
   pnpm dev
   ```

2. **Access your application**
   - **Web App**: http://localhost:3000
   - **Shared Package**: Auto-reloads when changed

### Adding New Features

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # Examples:
   # git checkout -b feature/user-authentication
   # git checkout -b feature/ai-insights-dashboard
   # git checkout -b fix/navigation-bug
   ```

2. **Set up your development environment**
   ```bash
   # Ensure environment variables are configured
   cp .env.example .env.local  # If not already done
   
   # Start development
   pnpm dev
   ```

3. **Make your changes following the project structure**
   - **UI Components**: `apps/web/app/` or `apps/web/src/components/`
   - **Shared Types**: `packages/shared/src/types/`
   - **Shared Utils**: `packages/shared/src/utils/`
   - **Styles**: `apps/web/app/globals.css` or component-specific CSS

4. **Follow code quality practices**
   ```bash
   # Run linting and formatting
   pnpm lint       # Check for issues
   pnpm lint:fix   # Auto-fix issues
   pnpm format     # Format code with Prettier
   
   # Type checking
   pnpm type-check # Verify TypeScript types
   
   # Build verification
   pnpm build      # Ensure everything builds correctly
   ```

5. **Test your changes locally**
   ```bash
   # Development testing
   pnpm dev        # Test in development mode
   
   # Production testing
   pnpm build      # Build for production
   pnpm start      # Test production build locally
   ```

6. **Commit your changes**
   ```bash
   # Stage your changes
   git add .
   
   # Commit with conventional commit format
   git commit -m "feat: add user authentication system"
   git commit -m "fix: resolve navigation menu overflow"
   git commit -m "docs: update API documentation"
   git commit -m "style: improve button hover effects"
   
   # Push to your branch
   git push origin feature/your-feature-name
   ```

### Working with Dependencies

```bash
# Add runtime dependencies to web app
pnpm add package-name --filter=@seriously-ai/web
pnpm add react-query --filter=@seriously-ai/web

# Add runtime dependencies to shared package
pnpm add package-name --filter=@seriously-ai/shared
pnpm add date-fns --filter=@seriously-ai/shared

# Add development dependencies to root
pnpm add -D package-name -w
pnpm add -D @types/node -w

# Remove dependencies
pnpm remove package-name --filter=@seriously-ai/web
```

### Working with the Shared Package

The shared package (`@seriously-ai/shared`) is the central hub for:
- **Types**: TypeScript interfaces (`User`, `Insight`, etc.)
- **Utils**: Common functions (`formatDate`, `validateEmail`, etc.)
- **Constants**: Shared configurations and enums
- **Schemas**: Validation schemas (when added)

**Development workflow for shared package:**

1. **Make changes to shared package**
   ```bash
   # Navigate to shared package
   cd packages/shared
   
   # Make your changes in src/
   # Add new types to src/types/
   # Add new utils to src/utils/
   ```

2. **Build and test the package**
   ```bash
   # Build the shared package
   pnpm build --filter=@seriously-ai/shared
   
   # Or use watch mode during development
   pnpm dev --filter=@seriously-ai/shared
   ```

3. **Use in web application**
   ```typescript
   // The changes are immediately available in the web app
   import { User, formatDate } from '@seriously-ai/shared'
   
   const user: User = { ... }
   const formattedDate = formatDate(new Date())
   ```

### Code Review and Quality Checks

Before submitting your changes:

```bash
# Complete quality check workflow
pnpm install        # Ensure dependencies are up to date
pnpm type-check     # TypeScript type checking
pnpm lint           # ESLint code quality
pnpm format         # Prettier code formatting
pnpm build          # Verify production build
```

### Troubleshooting Common Issues

**Build errors:**
```bash
# Clear all build outputs and node_modules
pnpm clean
rm -rf node_modules
pnpm install

# Rebuild shared package
pnpm build --filter=@seriously-ai/shared
```

**Type errors:**
```bash
# Restart TypeScript server in your editor
# For VS Code: Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"

# Check TypeScript configuration
pnpm type-check
```

**Dependency issues:**
```bash
# Reinstall all dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 🔧 Environment Variables

### Environment File Locations

Environment variables are configured differently based on your environment:

```bash
# Development (local machine)
.env.local              # Your local environment variables (gitignored)
.env.example            # Template with all available variables

# Production (Vercel/hosting platform)
# Set directly in your hosting platform's dashboard
```

### Setting Up Development Environment

1. **Copy the example file**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values:
   ```bash
   # Required for development
   NODE_ENV=development
   NEXT_PUBLIC_FEATURE_AI_INSIGHTS=true
   
   # Optional for local development
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Never commit** `.env.local` - it's already in `.gitignore`

### Production Environment Variables

For production deployment, configure these in your hosting platform:

```bash
# Database (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Required)
OPENAI_API_KEY=your_openai_api_key

# Authentication (Required)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secure_random_secret

# Payments (Required for billing features)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional feature flags
NEXT_PUBLIC_FEATURE_AI_INSIGHTS=true
NEXT_PUBLIC_FEATURE_ANALYTICS=true
```

### Environment Variable Precedence

Next.js loads environment variables in this order (highest priority first):
1. `.env.local` (loaded in all environments except test)
2. `.env.development` / `.env.production` (environment-specific)
3. `.env` (default for all environments)

**Important Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never put secrets in `NEXT_PUBLIC_` variables
- Use `.env.local` for local development secrets
- Set production variables directly in your hosting platform

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Build for Production

```bash
pnpm build
```

The web application will be built to `apps/web/.next/` and can be deployed to any Node.js hosting platform.

## 📚 Documentation

- **[Next.js Documentation](https://nextjs.org/docs)** - Learn about Next.js features
- **[TailwindCSS Documentation](https://tailwindcss.com/docs)** - CSS utility classes
- **[Turborepo Documentation](https://turbo.build/repo/docs)** - Monorepo management
- **[TypeScript Documentation](https://www.typescriptlang.org/docs/)** - Type system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/seriously-ai/seriously-ai/issues)
- **Email**: support@seriously-ai.com

---

<div align="center">
  <strong>Built with ❤️ by the Seriously AI Team</strong>
</div> 