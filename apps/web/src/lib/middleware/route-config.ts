/**
 * Route Protection Configuration
 * Defines protection levels and route mappings for the middleware system
 */

export enum ProtectionLevel {
  /**
   * PUBLIC - No authentication required
   * Anyone can access these routes
   */
  PUBLIC = 'public',
  
  /**
   * AUTHENTICATED - Valid session required
   * User must be logged in but no credit check
   */
  AUTHENTICATED = 'authenticated',
  
  /**
   * PAID - Credits and session required  
   * User must be logged in AND have available credits
   */
  PAID = 'paid'
}

/**
 * Route configuration with detailed categorization
 */
export const ROUTE_PROTECTION_CONFIG = {
  
  /**
   * PUBLIC ROUTES - No authentication required
   */
  [ProtectionLevel.PUBLIC]: {
    // Landing and marketing pages
    pages: [
      '/',
      '/about',
      '/pricing',
      '/features',
      '/blog',
      '/blog/*',
      '/privacy',
      '/terms',
      '/contact',
      '/test'
    ],
    
    // Authentication flows
    auth: [
      '/auth/login',
      '/auth/signup',
      '/auth/verify-email',
      '/auth/callback',
      '/auth/reset-password',
      '/auth/update-password'
    ],
    
    // API endpoints for public access
    api: [
      '/api/auth/callback',
      '/api/health',
      '/api/status',
      '/api/monitoring',
      '/api/monitoring/*'
    ],
    
    // Static assets and Next.js internals
    static: [
      '/_next',
      '/_next/*',
      '/favicon.ico',
      '/manifest.json',
      '/robots.txt',
      '/sitemap.xml',
      '/api/_next/*'
    ]
  },

  /**
   * AUTHENTICATED ROUTES - Valid session required
   */
  [ProtectionLevel.AUTHENTICATED]: {
    // User management and settings
    user: [
      '/dashboard',
      '/profile',
      '/settings',
      '/account',
      '/account/*'
    ],
    
    // Content management (viewing only)
    content: [
      '/library',
      '/library/*',
      '/history',
      '/saved'
    ],
    
    // API endpoints for authenticated users
    api: [
      '/api/user',
      '/api/user/*',
      '/api/profile',
      '/api/profile/*',
      '/api/settings',
      '/api/settings/*'
    ]
  },

  /**
   * PAID ROUTES - Credits and session required
   */
  [ProtectionLevel.PAID]: {
    // AI research and content generation
    research: [
      '/research',
      '/research/*',
      '/new-research'
    ],
    
    // Insights management
    insights: [
      '/insights',
      '/insights/*',
      '/insights/create',
      '/insights/edit/*'
    ],
    
    // Draft creation and editing
    drafts: [
      '/drafts',
      '/drafts/*',
      '/drafts/create',
      '/drafts/edit/*',
      '/generate'
    ],
    
    // Pipeline and AI operations
    pipeline: [
      '/pipeline',
      '/pipeline/*',
      '/templates',
      '/templates/*'
    ],
    
    // API endpoints that consume credits
    api: [
      '/api/research',
      '/api/research/*',
      '/api/insights',
      '/api/insights/*',
      '/api/drafts',
      '/api/drafts/*',
      '/api/generate',
      '/api/generate/*',
      '/api/pipeline',
      '/api/pipeline/*',
      '/api/ai/*'
    ]
  }
} as const

/**
 * Flattened route arrays for efficient matching
 */
export const FLATTENED_ROUTES = {
  public: [
    ...ROUTE_PROTECTION_CONFIG.public.pages,
    ...ROUTE_PROTECTION_CONFIG.public.auth,
    ...ROUTE_PROTECTION_CONFIG.public.api,
    ...ROUTE_PROTECTION_CONFIG.public.static
  ],
  authenticated: [
    ...ROUTE_PROTECTION_CONFIG.authenticated.user,
    ...ROUTE_PROTECTION_CONFIG.authenticated.content,
    ...ROUTE_PROTECTION_CONFIG.authenticated.api
  ],
  paid: [
    ...ROUTE_PROTECTION_CONFIG.paid.research,
    ...ROUTE_PROTECTION_CONFIG.paid.insights,
    ...ROUTE_PROTECTION_CONFIG.paid.drafts,
    ...ROUTE_PROTECTION_CONFIG.paid.pipeline,
    ...ROUTE_PROTECTION_CONFIG.paid.api
  ]
} as const

/**
 * Route pattern matching utilities with performance optimizations
 */
export class RouteProtectionMatcher {
  private static routeCache = new Map<string, ProtectionLevel>()
  private static readonly CACHE_SIZE_LIMIT = 500

  /**
   * Check if a path matches a route pattern (supports wildcards)
   */
  static matchesPattern(path: string, pattern: string): boolean {
    // Exact match
    if (path === pattern) return true
    
    // Wildcard pattern matching
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2)
      return path.startsWith(basePattern + '/') || path === basePattern
    }
    
    // Startswith pattern matching
    if (pattern.endsWith('*')) {
      const basePattern = pattern.slice(0, -1)
      return path.startsWith(basePattern)
    }
    
    return false
  }

  /**
   * Determine the protection level for a given pathname with caching
   */
  static getProtectionLevel(pathname: string): ProtectionLevel {
    // Check cache first
    const cached = this.routeCache.get(pathname)
    if (cached !== undefined) {
      // Record cache hit
      try {
        const { PerformanceMonitor } = require('./performance-monitor')
        PerformanceMonitor.recordCacheHit('route', true)
      } catch {
        // Performance monitoring not available, continue silently
      }
      return cached
    }
    
    // Record cache miss
    try {
      const { PerformanceMonitor } = require('./performance-monitor')
      PerformanceMonitor.recordCacheHit('route', false)
    } catch {
      // Performance monitoring not available, continue silently
    }

    let level: ProtectionLevel

    // Check paid routes first (most restrictive)
    if (FLATTENED_ROUTES.paid.some(route => this.matchesPattern(pathname, route))) {
      level = ProtectionLevel.PAID
    }
    // Check authenticated routes
    else if (FLATTENED_ROUTES.authenticated.some(route => this.matchesPattern(pathname, route))) {
      level = ProtectionLevel.AUTHENTICATED
    }
    // Check public routes
    else if (FLATTENED_ROUTES.public.some(route => this.matchesPattern(pathname, route))) {
      level = ProtectionLevel.PUBLIC
    }
    // Default to authenticated for unknown routes (secure by default)
    else {
      level = ProtectionLevel.AUTHENTICATED
    }

    // Cache the result with size management
    this.cacheResult(pathname, level)
    return level
  }

  /**
   * Cache a route result with size management
   */
  private static cacheResult(pathname: string, level: ProtectionLevel): void {
    // Clear cache if it gets too large (simple FIFO)
    if (this.routeCache.size >= this.CACHE_SIZE_LIMIT) {
      const entriesToRemove = Array.from(this.routeCache.keys()).slice(0, this.CACHE_SIZE_LIMIT / 2)
      entriesToRemove.forEach(key => this.routeCache.delete(key))
    }
    
    this.routeCache.set(pathname, level)
  }

  /**
   * Check if a route requires authentication
   */
  static requiresAuth(pathname: string): boolean {
    const level = this.getProtectionLevel(pathname)
    return level === ProtectionLevel.AUTHENTICATED || level === ProtectionLevel.PAID
  }

  /**
   * Check if a route requires credits
   */
  static requiresCredits(pathname: string): boolean {
    return this.getProtectionLevel(pathname) === ProtectionLevel.PAID
  }

  /**
   * Get human-readable description of protection level
   */
  static getProtectionDescription(level: ProtectionLevel): string {
    switch (level) {
      case ProtectionLevel.PUBLIC:
        return 'Public access - no authentication required'
      case ProtectionLevel.AUTHENTICATED:
        return 'Authenticated access - valid session required'
      case ProtectionLevel.PAID:
        return 'Paid access - valid session and credits required'
      default:
        return 'Unknown protection level'
    }
  }

  /**
   * Simple route categorization utilities
   */
  static isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api/')
  }

  static isAuthRoute(pathname: string): boolean {
    return pathname.startsWith('/auth/')
  }

  static isAIRoute(pathname: string): boolean {
    return /^\/(research|insights|drafts|generate|pipeline|templates)/.test(pathname) ||
           /^\/api\/(research|insights|drafts|generate|pipeline|ai)/.test(pathname)
  }

  static isStaticAsset(pathname: string): boolean {
    return /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|json)$/.test(pathname) ||
           pathname.startsWith('/_next/') ||
           pathname.startsWith('/static/')
  }

  /**
   * Clear the route cache (useful for testing)
   */
  static clearCache(): void {
    this.routeCache.clear()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.routeCache.size,
      maxSize: this.CACHE_SIZE_LIMIT
    }
  }
}

/**
 * Export the matcher instance for convenience
 */
export const routeMatcher = RouteProtectionMatcher

/**
 * Type definitions for better TypeScript support
 */
export type RouteCategory = keyof typeof ROUTE_PROTECTION_CONFIG
export type PublicRouteType = keyof typeof ROUTE_PROTECTION_CONFIG.public
export type AuthenticatedRouteType = keyof typeof ROUTE_PROTECTION_CONFIG.authenticated  
export type PaidRouteType = keyof typeof ROUTE_PROTECTION_CONFIG.paid 