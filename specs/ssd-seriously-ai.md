# System Specification Document: Seriously AI

## System Overview

Seriously AI is a distributed, serverless content intelligence platform that transforms scattered information into actionable content insights through intelligent research pipelines. The system leverages a microservices architecture deployed on Vercel's edge infrastructure, combining Next.js for the frontend experience with Node.js API services and Python workers for specialized processing tasks.

The platform operates as an intelligent content co-pilot, continuously monitoring trending topics, extracting credible insights with AI-powered analysis, and generating high-quality social media content using proven templates from successful creators. Built for scalability and reliability, the system supports approximately 1,000 daily active users globally while maintaining sub-second response times for core user interactions.

### Technical Vision
- **Serverless-First Architecture**: Leverage Vercel's edge functions and automatic scaling
- **Modular Pipeline Design**: Atomic jobs that can be composed into complex workflows
- **AI-Agnostic Integration Layer**: Flexible LLM provider switching without architectural changes
- **Real-time User Experience**: Instant feedback with background processing for heavy computations
- **Global Edge Distribution**: Sub-100ms response times worldwide through Vercel's CDN

## Core Modules & Responsibilities

### 1. **Authentication & User Management Service**
- **Responsibilities**: User registration, authentication, profile management, session handling
- **Components**: 
  - OAuth integration (Google, LinkedIn)
  - OTP verification system
  - User profile and preferences management
  - Role-based access control
- **Technology**: Supabase Auth + Next.js API routes
- **Deployment**: Vercel serverless functions

### 2. **Billing & Subscription Service**
- **Responsibilities**: Payment processing, subscription management, credit tracking, usage monitoring
- **Components**:
  - Stripe integration for payments and subscriptions
  - Credit-based usage system
  - Billing portal and invoice management
  - Usage analytics and alerts
- **Technology**: Stripe API + Supabase for billing records
- **Deployment**: Dedicated Vercel functions with webhook handlers

### 3. **Research Pipeline Service**
- **Responsibilities**: Content discovery, analysis, and insight extraction
- **Components**:
  - News aggregation workers (Google News, Reddit, Yahoo)
  - Content analysis and relevance scoring
  - AI-powered insight extraction
  - Job orchestration and queue management
- **Technology**: Node.js + Python workers, Redis (Upstash), OpenAI API
- **Deployment**: Vercel functions + external worker processes for long-running tasks

### 4. **Knowledge Library Service**
- **Responsibilities**: Insight storage, organization, and retrieval
- **Components**:
  - Insight repository with tagging and categorization
  - Topic subscription management
  - Search and recommendation engine
  - Reference and citation tracking
- **Technology**: Supabase PostgreSQL with full-text search
- **Deployment**: Vercel API routes with database integration

### 5. **Content Generation Service**
- **Responsibilities**: AI-powered content creation using templates and user style
- **Components**:
  - Template library management
  - Writing style analysis and adaptation
  - Multi-platform content generation
  - Draft management and versioning
- **Technology**: OpenAI API + template engine, Supabase storage
- **Deployment**: Vercel serverless functions

### 6. **Publishing & Scheduling Service**
- **Responsibilities**: Content calendar, social media publishing, analytics
- **Components**:
  - Content calendar and scheduling system
  - Social media API integrations (LinkedIn, future: Twitter)
  - Publishing workflow management
  - Basic performance analytics
- **Technology**: Social platform APIs, Supabase for scheduling data
- **Deployment**: Vercel functions with cron jobs

### 7. **Notification & Communication Service** *(Post-MVP)*
- **Responsibilities**: User notifications, approval workflows, alerts
- **Components**:
  - Email notifications
  - WhatsApp/Telegram integration for mobile approvals
  - Real-time updates and alerts
- **Technology**: Supabase real-time, third-party messaging APIs
- **Deployment**: Vercel functions with real-time subscriptions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Next.js App   │  │  API Functions  │  │  Cron Functions │ │
│  │   (Frontend)    │  │   (Services)    │  │  (Schedulers)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                       │                       │
           │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Redis Queue   │    │  External APIs  │
│   Database      │    │   (Upstash)     │    │                 │
│   Auth          │    │   Job Queue     │    │  • OpenAI       │
│   Real-time     │    │   Cache         │    │  • LinkedIn     │
│   Storage       │    │                 │    │  • News APIs    │
└─────────────────┘    └─────────────────┘    │  • Stripe       │
                                              └─────────────────┘
```

## Technology Stack

### **Frontend**
- **Framework**: Next.js 14+ with App Router
- **Styling**: TailwindCSS for utility-first styling
- **State Management**: React Context + SWR for data fetching
- **UI Components**: Radix UI or Shadcn/ui for accessible components
- **Rationale**: Next.js provides excellent Vercel integration, server-side rendering, and optimal performance. TailwindCSS enables rapid UI development with consistent design.

### **Backend**
- **Primary Language**: Node.js with TypeScript
- **Specialized Scripts**: Python (venv) for ML/AI processing tasks
- **API Framework**: Next.js API routes for standard endpoints
- **Job Processing**: Node.js workers with Redis queue (Upstash)
- **Rationale**: Node.js provides excellent performance for I/O-heavy operations, while Python handles specialized AI/ML tasks. TypeScript ensures type safety across the stack.

### **Database**
- **Primary Database**: Supabase (PostgreSQL-based)
- **Authentication**: Supabase Auth with OAuth providers
- **Real-time**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage for documents and media
- **Rationale**: Supabase provides managed PostgreSQL with built-in auth, real-time features, and excellent developer experience. Single database simplifies architecture while PostgreSQL handles complex queries efficiently.

### **Infrastructure**
- **Hosting**: Vercel for frontend and API functions
- **Job Queue**: Redis on Upstash for task management
- **CDN**: Vercel's global edge network
- **Monitoring**: Vercel Analytics + Supabase monitoring
- **Rationale**: Vercel provides seamless deployment, automatic scaling, and global distribution. Serverless architecture reduces operational overhead and scales automatically.

## Queue & Data Bus Architecture

### **Redis on Upstash**
Redis serves as the central nervous system for asynchronous processing and inter-service communication:

#### **Job Queue System**
```typescript
// Queue Structure
queues: {
  'research:discovery': Queue<DiscoveryJob>,      // RSS feed fetching
  'research:analysis': Queue<AnalysisJob>,        // Content analysis
  'insights:extraction': Queue<ExtractionJob>,    // AI insight extraction
  'content:generation': Queue<GenerationJob>,     // Content creation
  'publish:scheduled': Queue<PublishJob>,         // Publishing tasks
  'email:notifications': Queue<EmailJob>          // Email notifications
}

// Job Priority Levels
enum JobPriority {
  CRITICAL = 1,    // User-initiated actions
  HIGH = 2,        // Scheduled publishing
  NORMAL = 3,      // Regular processing
  LOW = 4          // Background analytics
}
```

#### **Event Bus Pattern**
```typescript
// Event-driven communication between services
interface EventBus {
  // Publishing events
  publish(event: SystemEvent): Promise<void>
  
  // Subscribing to events
  subscribe(eventType: EventType, handler: EventHandler): void
}

// Event Types
enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_UPGRADED = 'user.upgraded',
  
  // Content Events
  INSIGHT_DISCOVERED = 'insight.discovered',
  CONTENT_GENERATED = 'content.generated',
  POST_PUBLISHED = 'post.published',
  
  // Billing Events
  CREDITS_LOW = 'credits.low',
  SUBSCRIPTION_RENEWED = 'subscription.renewed'
}
```

#### **Data Flow Example**
```
1. User subscribes to "AI trends" topic
   → API creates DiscoveryJob in 'research:discovery' queue
   
2. Worker processes DiscoveryJob
   → Fetches RSS feeds
   → Creates multiple AnalysisJobs in 'research:analysis' queue
   → Publishes CONTENT_DISCOVERED event
   
3. Analysis workers process articles
   → Run AI analysis
   → Create ExtractionJobs for promising content
   → Store insights in database
   → Publish INSIGHT_DISCOVERED event
   
4. Content service listens to INSIGHT_DISCOVERED
   → Checks user preferences
   → Creates GenerationJob if auto-generation enabled
   
5. Generation complete
   → Publish CONTENT_GENERATED event
   → Notification service sends user alert
```

### **Caching Strategy**
Redis also serves as a high-performance cache:

```typescript
// Cache Layers
caches: {
  // Session cache (1 hour TTL)
  'session:{userId}': UserSession,
  
  // API response cache (5 minutes TTL)
  'api:trending:{topic}': TrendingInsights[],
  
  // User preferences cache (1 day TTL)
  'user:prefs:{userId}': UserPreferences,
  
  // Rate limiting (sliding window)
  'ratelimit:{userId}:{endpoint}': number
}
```

### **Why Upstash?**
- **Serverless-friendly**: Pay-per-request pricing aligns with Vercel functions
- **Global replication**: Low latency for worldwide users
- **Managed service**: No infrastructure maintenance
- **HTTP/REST API**: Works seamlessly with edge functions
- **Built-in persistence**: Reliable for job queuing

## Data Strategy

### **Data Architecture**
The system uses a single PostgreSQL database (Supabase) with logical separation through schemas and table organization:

```sql
-- User Management Schema
users (id, email, created_at, profile_data)
user_preferences (user_id, writing_style, topics, notifications)
subscriptions (user_id, plan, status, billing_data)

-- Content & Knowledge Schema  
insights (id, title, content, sources, tags, user_id, status)
topics (id, name, keywords, user_subscriptions)
content_drafts (id, insight_id, template_id, content, status, user_id)
templates (id, name, format, structure, creator_attribution)

-- Publishing & Analytics Schema
scheduled_posts (id, content_id, platform, scheduled_time, status)
published_content (id, draft_id, platform, published_at, metrics)
usage_tracking (user_id, action, credits_used, timestamp)
```

### **Data Flow**
1. **Ingestion**: News APIs → Processing Queue → Insights Database
2. **Processing**: User Preferences + Insights → AI Processing → Content Drafts
3. **Publishing**: Approved Drafts → Platform APIs → Analytics Storage
4. **Analytics**: User Actions → Usage Tracking → Billing Calculations

### **Data Management**
- **Backup Strategy**: Automated daily backups via Supabase
- **Data Retention**: 2-year retention for user content, 1-year for analytics
- **Privacy Compliance**: GDPR-compliant data deletion workflows
- **Performance**: Database indexing on frequently queried fields (user_id, topics, timestamps)

## Authentication & Authorization

### **Authentication Strategy**
- **Primary Method**: OAuth 2.0 with Google and LinkedIn providers
- **Fallback Method**: OTP (One-Time Password) via email
- **Session Management**: JWT tokens with automatic refresh
- **Security**: Supabase handles secure token storage and validation

### **Authorization Model**
```typescript
// Role-based access control
enum UserRole {
  STARTER = 'starter',
  PLUS = 'plus', 
  PRO = 'pro'
}

// Feature access matrix
const FEATURE_ACCESS = {
  [UserRole.STARTER]: {
    credits_per_month: 50,
    insights_per_day: 5,
    templates_access: 'basic',
    publishing_platforms: ['linkedin']
  },
  [UserRole.PLUS]: {
    credits_per_month: 500,
    insights_per_day: 50,
    templates_access: 'extended',
    publishing_platforms: ['linkedin', 'twitter']
  },
  [UserRole.PRO]: {
    credits_per_month: 1500,
    insights_per_day: 'unlimited',
    templates_access: 'all',
    publishing_platforms: 'all'
  }
}
```

### **Security Measures**
- **API Rate Limiting**: Per-user and per-endpoint rate limits
- **Input Validation**: Comprehensive input sanitization and validation
- **CORS Configuration**: Strict cross-origin resource sharing policies
- **Environment Security**: Encrypted environment variables for API keys

## External Integrations

### **AI & LLM Services**
- **Primary Provider**: OpenAI (GPT-4, GPT-3.5-turbo)
- **Integration Pattern**: Abstract service layer for provider flexibility
- **Fallback Strategy**: Graceful degradation if primary provider unavailable
- **Cost Management**: Request batching and intelligent prompt optimization

```typescript
// AI Service Abstraction
interface LLMProvider {
  generateInsight(content: string, context: string): Promise<Insight>
  generateContent(insight: Insight, template: Template): Promise<ContentDraft>
  analyzeWritingStyle(samples: string[]): Promise<WritingStyle>
}
```

### **News & Content Sources**
- **Google News RSS**: Primary news aggregation source
- **Reddit API**: Community discussions and trending topics
- **Yahoo Finance RSS**: Business and market insights
- **Future Integrations**: NewsAPI, specialized industry feeds

### **Social Media Platforms**
- **LinkedIn API**: Content publishing and profile analysis
- **Future Platforms**: Twitter API v2, potentially Instagram Business API
- **Publishing Strategy**: Direct API integration to maintain control and reduce costs

### **Payment & Billing**
- **Stripe Integration**: Subscription management, payment processing, billing portal
- **Webhook Handling**: Real-time subscription status updates
- **Credit System**: Usage-based billing with overage protection

### **Infrastructure Services**
- **Supabase**: Database, authentication, real-time features, file storage
- **Upstash Redis**: Job queuing, caching, session storage
- **Vercel**: Hosting, serverless functions, global CDN

## Application Directory Structure

### **Monorepo Organization**
The project follows a monorepo structure to maintain code consistency and enable shared utilities across services:

```
seriously-ai/
├── apps/
│   ├── web/                         # Next.js frontend application
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── (auth)/             # Auth-related pages
│   │   │   ├── (dashboard)/        # Main app dashboard
│   │   │   ├── (marketing)/        # Landing pages
│   │   │   ├── api/                # API routes
│   │   │   └── layout.tsx          # Root layout
│   │   ├── components/              # React components
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   ├── features/           # Feature-specific components
│   │   │   └── layouts/            # Layout components
│   │   ├── lib/                     # Frontend utilities
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── utils/              # Helper functions
│   │   │   └── api/                # API client utilities
│   │   ├── public/                  # Static assets
│   │   └── styles/                  # Global styles and Tailwind config
│   │
│   └── workers/                     # Node.js background job workers (consume from Redis queues)
│       ├── research-pipeline/       # News aggregation and analysis (Node.js + Python scripts)
│       │   ├── discovery-worker.ts  # Processes discovery queue
│       │   ├── analysis-worker.ts   # Processes analysis queue
│       │   └── extraction-worker.ts # Processes extraction queue
│       ├── content-generator/       # AI content generation (Node.js)
│       │   └── generation-worker.ts # Processes content generation queue
│       └── publisher/               # Social media publishing (Node.js)
│           └── publish-worker.ts    # Processes publishing queue
│
├── packages/                        # Shared packages
│   ├── database/                    # Database schema and migrations
│   │   ├── schema/                  # Supabase table definitions
│   │   ├── migrations/              # Database migrations
│   │   └── seed/                    # Seed data scripts
│   │
│   ├── shared/                      # Shared TypeScript code
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── constants/               # Shared constants
│   │   ├── utils/                   # Shared utilities
│   │   └── config/                  # Configuration types
│   │
│   └── ai-services/                 # AI service abstractions
│       ├── providers/               # LLM provider implementations
│       ├── templates/               # Content templates
│       └── prompts/                 # AI prompt templates
│
├── services/                        # Microservices (Node.js Vercel Functions)
│   ├── auth/                        # Authentication service (Node.js)
│   │   ├── login/                   # OAuth and OTP login
│   │   └── session/                 # Session management
│   │
│   ├── billing/                     # Billing and subscription service
│   │   ├── stripe-webhook/          # Stripe webhook handlers
│   │   ├── subscription/            # Subscription management
│   │   └── credits/                 # Credit tracking
│   │
│   ├── research/                    # Research pipeline service
│   │   ├── sources/                 # News source integrations
│   │   ├── analyzer/                # Content analysis
│   │   └── insights/                # Insight extraction
│   │
│   ├── content/                     # Content generation service
│   │   ├── generate/                # Content generation endpoints
│   │   ├── templates/               # Template management
│   │   └── style/                   # Writing style analysis
│   │
│   └── publisher/                   # Publishing service
│       ├── schedule/                # Content scheduling
│       └── platforms/               # Platform-specific publishers
│
├── scripts/                         # Utility scripts
│   ├── python/                      # Python analysis scripts
│   │   ├── requirements.txt         # Python dependencies
│   │   └── ml_analysis/             # ML/AI processing scripts
│   │
│   └── setup/                       # Setup and deployment scripts
│
├── docs/                            # Documentation
│   ├── api/                         # API documentation
│   ├── architecture/                # Architecture decisions
│   └── deployment/                  # Deployment guides
│
├── tests/                           # Test suites
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
│
└── config/                          # Configuration files
    ├── .env.example                 # Environment variables template
    ├── vercel.json                  # Vercel configuration
    ├── turbo.json                   # Turborepo configuration
    ├── tsconfig.base.json           # Base TypeScript config
    └── package.json                 # Root package configuration
```

### **Technology Stack by Directory**

#### **Node.js Throughout**
The entire backend infrastructure runs on Node.js with TypeScript:
- **API Routes** (`apps/web/app/api/`): Next.js API routes (Node.js runtime)
- **Microservices** (`services/`): Node.js functions deployed to Vercel
- **Workers** (`apps/workers/`): Long-running Node.js processes for background jobs
- **Shared Packages** (`packages/`): TypeScript/Node.js shared libraries

#### **Python Integration**
- **Scripts** (`scripts/python/`): Specialized ML/AI analysis scripts
- **Worker Integration**: Node.js workers can spawn Python processes for specific tasks

### **Key Directory Patterns**

#### **Frontend (apps/web)**
- **App Router Structure**: Leverages Next.js 14+ App Router with route groups for organization
- **Component Organization**: Separates UI primitives from feature-specific components
- **API Routes**: Co-located with frontend for optimal Vercel deployment (Node.js runtime)

#### **Services Architecture**
- **Function-per-endpoint**: Each Vercel function handles specific business logic
- **Shared Logic**: Common code lives in `packages/` to avoid duplication
- **Service Isolation**: Each service has its own directory with clear boundaries

#### **Package Management**
- **Monorepo Tools**: Uses Turborepo for efficient builds and caching
- **Shared Dependencies**: Common dependencies managed at root level
- **TypeScript Paths**: Configured for easy imports across packages

### **File Naming Conventions**
```typescript
// Components: PascalCase
components/ContentEditor.tsx
components/ui/Button.tsx

// Utilities: camelCase
lib/utils/formatDate.ts
lib/hooks/useSubscription.ts

// API Routes: kebab-case
app/api/auth/login/route.ts
app/api/content/generate/route.ts

// Types: PascalCase with .types.ts extension
types/User.types.ts
types/Content.types.ts
```

### **Environment Configuration**
```bash
# Development
.env.local                   # Local development variables

# Production
.env.production             # Production variables (Vercel)

# Shared
.env.example               # Template for required variables
```

## Scalability & Deployment

### **Deployment Strategy**
- **Environment Setup**: Development, Staging, Production environments
- **CI/CD Pipeline**: GitHub Actions with automatic deployment to Vercel
- **Feature Flags**: Gradual feature rollouts using Vercel's edge configuration
- **Monitoring**: Vercel Analytics, Supabase monitoring, custom error tracking

### **Scalability Considerations**

#### **Horizontal Scaling**
- **Serverless Auto-scaling**: Vercel functions automatically scale based on demand
- **Database Scaling**: Supabase handles connection pooling and read replicas
- **Queue Processing**: Redis queue workers can be horizontally scaled

#### **Performance Optimization**
- **Edge Caching**: Vercel CDN for static assets and API responses where appropriate
- **Database Optimization**: Proper indexing, query optimization, connection pooling
- **Job Batching**: Group similar processing tasks to reduce API calls

#### **Cost Management**
- **Function Optimization**: Efficient code to minimize serverless execution time
- **API Rate Limiting**: Prevent abuse and control third-party API costs
- **Smart Caching**: Cache frequently accessed data to reduce database queries

### **Monitoring & Observability**
- **Application Monitoring**: Vercel Analytics for performance metrics
- **Error Tracking**: Custom error handling with alerting
- **Business Metrics**: User engagement, credit usage, conversion tracking
- **Infrastructure Health**: Database performance, API response times, queue status

### **Disaster Recovery**
- **Database Backups**: Automated daily backups with point-in-time recovery
- **Code Repository**: Git-based version control with multiple deployment targets
- **Service Redundancy**: Multiple deployment regions through Vercel's global network
- **Data Export**: User data export capabilities for compliance and backup

### **Security & Compliance**
- **Data Protection**: GDPR compliance, data encryption at rest and in transit
- **PCI Compliance**: Stripe handles payment data, reducing compliance scope
- **Access Control**: Principle of least privilege for all system components
- **Audit Logging**: Comprehensive logging for security and compliance monitoring

---

*This System Specification Document serves as the technical blueprint for implementing Seriously AI's intelligent content generation platform. It balances scalability, maintainability, and cost-effectiveness while supporting the ambitious vision outlined in the Product Specification Document.* 