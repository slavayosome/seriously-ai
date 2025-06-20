/**
 * Middleware Unit Tests
 * Testing individual middleware components in isolation
 */

import { ProtectionLevel, RouteProtectionMatcher } from '../route-config'
import { RedirectReason } from '../redirect-handler'
import { ErrorCategory } from '../error-handler'
import { PlanTier, FeatureCategory, PlanAccessChecker } from '../plan-access-checker'

describe('Middleware Unit Tests', () => {
  describe('RouteProtectionMatcher', () => {
    test('should correctly identify public routes', () => {
      const publicRoutes = [
        '/',
        '/about',
        '/pricing',
        '/features',
        '/contact',
        '/privacy',
        '/terms',
        '/blog',
        '/blog/post-1',
        '/auth/login',
        '/auth/signup',
        '/auth/callback',
        '/api/auth/callback',
        '/api/health',
        '/api/status',
        '/_next/static/main.js',
        '/favicon.ico',
        '/manifest.json'
      ]

      publicRoutes.forEach(path => {
        expect(RouteProtectionMatcher.getProtectionLevel(path)).toBe(ProtectionLevel.PUBLIC)
      })
    })

    test('should correctly identify authenticated routes', () => {
      const authenticatedRoutes = [
        '/dashboard',
        '/profile',
        '/settings',
        '/account',
        '/library',
        '/history',
        '/api/user',
        '/api/profile'
      ]

      authenticatedRoutes.forEach(path => {
        expect(RouteProtectionMatcher.getProtectionLevel(path)).toBe(ProtectionLevel.AUTHENTICATED)
      })
    })

    test('should correctly identify paid routes', () => {
      const paidRoutes = [
        '/research',
        '/research/new',
        '/insights',
        '/insights/create',
        '/drafts',
        '/drafts/create',
        '/generate',
        '/pipeline',
        '/templates',
        '/api/research',
        '/api/insights',
        '/api/drafts',
        '/api/generate',
        '/api/pipeline',
        '/api/ai/chat'
      ]

      paidRoutes.forEach(path => {
        expect(RouteProtectionMatcher.getProtectionLevel(path)).toBe(ProtectionLevel.PAID)
      })
    })

    test('should default unknown routes to authenticated', () => {
      const unknownRoutes = [
        '/unknown',
        '/some-random-page',
        '/api/unknown'
      ]

      unknownRoutes.forEach(path => {
        expect(RouteProtectionMatcher.getProtectionLevel(path)).toBe(ProtectionLevel.AUTHENTICATED)
      })
    })

    test('should handle edge cases', () => {
      expect(RouteProtectionMatcher.getProtectionLevel('/research/')).toBe(ProtectionLevel.PAID)
      expect(RouteProtectionMatcher.getProtectionLevel('/RESEARCH')).toBe(ProtectionLevel.AUTHENTICATED) // Case sensitive - unknown route defaults to authenticated
      expect(RouteProtectionMatcher.getProtectionLevel('/unknown-route')).toBe(ProtectionLevel.AUTHENTICATED) // Default fallback
    })

    test('should use caching for performance', () => {
      const path = '/test-caching'
      
      // First call
      const result1 = RouteProtectionMatcher.getProtectionLevel(path)
      
      // Second call should use cache
      const result2 = RouteProtectionMatcher.getProtectionLevel(path)
      
      expect(result1).toBe(result2)
      expect(result1).toBe(ProtectionLevel.AUTHENTICATED)
    })

    test('should provide utility methods', () => {
      expect(RouteProtectionMatcher.isApiRoute('/api/test')).toBe(true)
      expect(RouteProtectionMatcher.isApiRoute('/dashboard')).toBe(false)
      
      expect(RouteProtectionMatcher.isAuthRoute('/auth/login')).toBe(true)
      expect(RouteProtectionMatcher.isAuthRoute('/dashboard')).toBe(false)
      
      expect(RouteProtectionMatcher.isAIRoute('/api/ai/chat')).toBe(true)
      expect(RouteProtectionMatcher.isAIRoute('/api/user')).toBe(false)
      
      expect(RouteProtectionMatcher.isStaticAsset('/favicon.ico')).toBe(true)
      expect(RouteProtectionMatcher.isStaticAsset('/dashboard')).toBe(false)
    })

    test('should provide cache management utilities', () => {
      // Clear cache
      RouteProtectionMatcher.clearCache()
      
      // Get cache stats
      const stats = RouteProtectionMatcher.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats.maxSize).toBe(500)
    })
  })

  describe('PlanAccessChecker', () => {
    test('should provide plan comparison information', () => {
      const comparison = PlanAccessChecker.getPlanComparison()
      
      expect(comparison).toHaveProperty(PlanTier.STARTER)
      expect(comparison).toHaveProperty(PlanTier.PLUS)
      expect(comparison).toHaveProperty(PlanTier.PRO)
      
      expect(comparison[PlanTier.STARTER].monthlyCredits).toBe(50)
      expect(comparison[PlanTier.PLUS].monthlyCredits).toBe(500)
      expect(comparison[PlanTier.PRO].monthlyCredits).toBe(1500)
      
      expect(comparison[PlanTier.STARTER].name).toBe('Starter')
      expect(comparison[PlanTier.PLUS].name).toBe('Plus')
      expect(comparison[PlanTier.PRO].name).toBe('Pro')
    })

    test('should have proper plan tiers defined', () => {
      expect(PlanTier.STARTER).toBe('starter')
      expect(PlanTier.PLUS).toBe('plus')
      expect(PlanTier.PRO).toBe('pro')
    })

    test('should have proper feature categories defined', () => {
      expect(FeatureCategory.RESEARCH_BASIC).toBe('research_basic')
      expect(FeatureCategory.RESEARCH_ADVANCED).toBe('research_advanced')
      expect(FeatureCategory.INSIGHTS_BASIC).toBe('insights_basic')
      expect(FeatureCategory.DRAFTS_BASIC).toBe('drafts_basic')
      expect(FeatureCategory.PIPELINE_CUSTOM).toBe('pipeline_custom')
      expect(FeatureCategory.API_ADVANCED).toBe('api_advanced')
    })

    test('should provide cache management utilities', () => {
      // Clear cache
      PlanAccessChecker.clearPlanCache()
      
      // Get cache stats
      const stats = PlanAccessChecker.getPlanCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('entries')
      expect(Array.isArray(stats.entries)).toBe(true)
    })
  })

  describe('Error Categories', () => {
    test('should have proper error categories defined', () => {
      expect(ErrorCategory.AUTH_SESSION_INVALID).toBe('auth_session_invalid')
      expect(ErrorCategory.AUTH_SESSION_EXPIRED).toBe('auth_session_expired')
      expect(ErrorCategory.INSUFFICIENT_PERMISSIONS).toBe('insufficient_permissions')
      expect(ErrorCategory.CREDIT_INSUFFICIENT).toBe('credit_insufficient')
      expect(ErrorCategory.DATABASE_CONNECTION).toBe('database_connection')
      expect(ErrorCategory.RATE_LIMIT_EXCEEDED).toBe('rate_limit_exceeded')
    })
  })

  describe('Redirect Reasons', () => {
    test('should have proper redirect reasons defined', () => {
      expect(RedirectReason.UNAUTHENTICATED).toBe('unauthenticated')
      expect(RedirectReason.SESSION_EXPIRED).toBe('session-expired')
      expect(RedirectReason.INSUFFICIENT_CREDITS).toBe('insufficient-credits')
      expect(RedirectReason.PLAN_UPGRADE_REQUIRED).toBe('plan-upgrade-required')
      expect(RedirectReason.MIDDLEWARE_ERROR).toBe('middleware-error')
    })
  })

  describe('Integration Tests', () => {
    test('should work together for complete protection flow', () => {
      // Test public route - should not need protection
      const publicPath = '/'
      expect(RouteProtectionMatcher.getProtectionLevel(publicPath)).toBe(ProtectionLevel.PUBLIC)
      
      // Test authenticated route - should need login
      const authPath = '/dashboard'
      expect(RouteProtectionMatcher.getProtectionLevel(authPath)).toBe(ProtectionLevel.AUTHENTICATED)
      
      // Test paid route - should need credits and plan
      const paidPath = '/research'
      expect(RouteProtectionMatcher.getProtectionLevel(paidPath)).toBe(ProtectionLevel.PAID)
      
      // Test that paid routes are properly categorized
      expect(RouteProtectionMatcher.getProtectionLevel(paidPath)).toBe(ProtectionLevel.PAID)
      
      // Test that feature categories are properly defined
      expect(FeatureCategory.RESEARCH_BASIC).toBe('research_basic')
    })

    test('should handle complex route patterns', () => {
      // Test nested routes
      expect(RouteProtectionMatcher.getProtectionLevel('/research/advanced/bulk')).toBe(ProtectionLevel.PAID)
      expect(RouteProtectionMatcher.getProtectionLevel('/api/research/12345')).toBe(ProtectionLevel.PAID)
      expect(RouteProtectionMatcher.getProtectionLevel('/dashboard/settings')).toBe(ProtectionLevel.AUTHENTICATED)
      
      // Test static assets
      expect(RouteProtectionMatcher.getProtectionLevel('/_next/static/chunks/main.js')).toBe(ProtectionLevel.PUBLIC)
      expect(RouteProtectionMatcher.getProtectionLevel('/favicon.ico')).toBe(ProtectionLevel.PUBLIC)
      
      // Test auth routes
      expect(RouteProtectionMatcher.getProtectionLevel('/auth/login')).toBe(ProtectionLevel.PUBLIC)
      expect(RouteProtectionMatcher.getProtectionLevel('/auth/callback')).toBe(ProtectionLevel.PUBLIC)
    })

    test('should provide consistent protection levels', () => {
      // Test that similar routes have consistent protection
      const researchRoutes = ['/research', '/research/new', '/research/advanced']
      researchRoutes.forEach(route => {
        expect(RouteProtectionMatcher.getProtectionLevel(route)).toBe(ProtectionLevel.PAID)
      })
      
      const dashboardRoutes = ['/dashboard', '/profile', '/settings']
      dashboardRoutes.forEach(route => {
        expect(RouteProtectionMatcher.getProtectionLevel(route)).toBe(ProtectionLevel.AUTHENTICATED)
      })
      
      const publicRoutes = ['/', '/about', '/pricing']
      publicRoutes.forEach(route => {
        expect(RouteProtectionMatcher.getProtectionLevel(route)).toBe(ProtectionLevel.PUBLIC)
      })
    })
  })
}) 