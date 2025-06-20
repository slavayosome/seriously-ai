/**
 * Plan-Based Feature Access Checker
 * Validates user subscription tier permissions for features and operations
 */

import { Database } from '@seriously-ai/shared'
import { createServerClient } from '@supabase/ssr'

/**
 * Subscription plan tiers with their capabilities
 */
export enum PlanTier {
  STARTER = 'starter',
  PLUS = 'plus', 
  PRO = 'pro'
}

/**
 * Feature categories that can be restricted by plan
 */
export enum FeatureCategory {
  // Research features
  RESEARCH_BASIC = 'research_basic',
  RESEARCH_ADVANCED = 'research_advanced',
  RESEARCH_BULK = 'research_bulk',
  
  // Insight features
  INSIGHTS_BASIC = 'insights_basic',
  INSIGHTS_ADVANCED = 'insights_advanced',
  INSIGHTS_BULK = 'insights_bulk',
  
  // Draft features
  DRAFTS_BASIC = 'drafts_basic',
  DRAFTS_ADVANCED = 'drafts_advanced',
  DRAFTS_TEMPLATES = 'drafts_templates',
  
  // Pipeline features
  PIPELINE_BASIC = 'pipeline_basic',
  PIPELINE_CUSTOM = 'pipeline_custom',
  PIPELINE_BATCH = 'pipeline_batch',
  
  // Export and sharing
  EXPORT_PDF = 'export_pdf',
  EXPORT_BULK = 'export_bulk',
  SHARING_ADVANCED = 'sharing_advanced',
  
  // API access
  API_BASIC = 'api_basic',
  API_ADVANCED = 'api_advanced',
  API_BULK = 'api_bulk'
}

/**
 * Plan feature matrix - defines what each plan can access
 */
const STARTER_FEATURES = [
  // Basic features only
  FeatureCategory.RESEARCH_BASIC,
  FeatureCategory.INSIGHTS_BASIC,
  FeatureCategory.DRAFTS_BASIC,
  FeatureCategory.PIPELINE_BASIC,
  FeatureCategory.EXPORT_PDF,
  FeatureCategory.API_BASIC
]

const PLUS_FEATURES = [
  // All starter features plus advanced
  ...STARTER_FEATURES,
  FeatureCategory.RESEARCH_ADVANCED,
  FeatureCategory.INSIGHTS_ADVANCED,
  FeatureCategory.DRAFTS_ADVANCED,
  FeatureCategory.DRAFTS_TEMPLATES,
  FeatureCategory.PIPELINE_CUSTOM,
  FeatureCategory.SHARING_ADVANCED,
  FeatureCategory.API_ADVANCED
]

const PRO_FEATURES = [
  // All plus features plus bulk operations
  ...PLUS_FEATURES,
  FeatureCategory.RESEARCH_BULK,
  FeatureCategory.INSIGHTS_BULK,
  FeatureCategory.PIPELINE_BATCH,
  FeatureCategory.EXPORT_BULK,
  FeatureCategory.API_BULK
]

export const PLAN_FEATURES: Record<PlanTier, FeatureCategory[]> = {
  [PlanTier.STARTER]: STARTER_FEATURES,
  [PlanTier.PLUS]: PLUS_FEATURES,
  [PlanTier.PRO]: PRO_FEATURES
}

/**
 * Feature detection from URL patterns
 */
export const FEATURE_URL_PATTERNS: Record<FeatureCategory, RegExp[]> = {
  // Research patterns
  [FeatureCategory.RESEARCH_BASIC]: [
    /^\/research$/,
    /^\/research\/[^/]+$/,
    /^\/api\/research\/basic/
  ],
  [FeatureCategory.RESEARCH_ADVANCED]: [
    /^\/research\/advanced/,
    /^\/research\/[^/]+\/analyze/,
    /^\/api\/research\/advanced/
  ],
  [FeatureCategory.RESEARCH_BULK]: [
    /^\/research\/bulk/,
    /^\/api\/research\/bulk/
  ],
  
  // Insights patterns
  [FeatureCategory.INSIGHTS_BASIC]: [
    /^\/insights$/,
    /^\/insights\/[^/]+$/,
    /^\/api\/insights\/basic/
  ],
  [FeatureCategory.INSIGHTS_ADVANCED]: [
    /^\/insights\/advanced/,
    /^\/insights\/[^/]+\/enhance/,
    /^\/api\/insights\/advanced/
  ],
  [FeatureCategory.INSIGHTS_BULK]: [
    /^\/insights\/bulk/,
    /^\/api\/insights\/bulk/
  ],
  
  // Draft patterns
  [FeatureCategory.DRAFTS_BASIC]: [
    /^\/drafts$/,
    /^\/drafts\/[^/]+$/,
    /^\/generate$/,
    /^\/api\/drafts\/basic/
  ],
  [FeatureCategory.DRAFTS_ADVANCED]: [
    /^\/drafts\/advanced/,
    /^\/generate\/advanced/,
    /^\/api\/drafts\/advanced/
  ],
  [FeatureCategory.DRAFTS_TEMPLATES]: [
    /^\/templates/,
    /^\/drafts\/[^/]+\/template/,
    /^\/api\/templates/
  ],
  
  // Pipeline patterns
  [FeatureCategory.PIPELINE_BASIC]: [
    /^\/pipeline$/,
    /^\/pipeline\/basic/,
    /^\/api\/pipeline\/basic/
  ],
  [FeatureCategory.PIPELINE_CUSTOM]: [
    /^\/pipeline\/custom/,
    /^\/pipeline\/[^/]+\/customize/,
    /^\/api\/pipeline\/custom/
  ],
  [FeatureCategory.PIPELINE_BATCH]: [
    /^\/pipeline\/batch/,
    /^\/api\/pipeline\/batch/
  ],
  
  // Export patterns
  [FeatureCategory.EXPORT_PDF]: [
    /^\/api\/export\/pdf/
  ],
  [FeatureCategory.EXPORT_BULK]: [
    /^\/api\/export\/bulk/
  ],
  
  // Sharing patterns
  [FeatureCategory.SHARING_ADVANCED]: [
    /^\/api\/share\/advanced/,
    /^\/share\/[^/]+\/collaborate/
  ],
  
  // API patterns
  [FeatureCategory.API_BASIC]: [
    /^\/api\/(research|insights|drafts)\/[^/]+$/
  ],
  [FeatureCategory.API_ADVANCED]: [
    /^\/api\/(research|insights|drafts)\/[^/]+\/advanced/
  ],
  [FeatureCategory.API_BULK]: [
    /^\/api\/(research|insights|drafts)\/bulk/
  ]
}

/**
 * Plan access validation result
 */
export interface PlanAccessResult {
  hasAccess: boolean
  userPlan: PlanTier
  requiredPlan?: PlanTier
  feature?: FeatureCategory
  upgradeOptions?: PlanTier[]
}

/**
 * Plan-based feature access checker
 */
export class PlanAccessChecker {
  private static planCache = new Map<string, { plan: PlanTier; timestamp: number }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string,
    feature: FeatureCategory
  ): Promise<PlanAccessResult> {
    try {
      // Get user's plan
      const userPlan = await this.getUserPlan(supabase, userId)
      
      // Check if plan includes this feature
      const hasAccess = PLAN_FEATURES[userPlan].includes(feature)
      
      if (hasAccess) {
        return {
          hasAccess: true,
          userPlan,
          feature
        }
      }
      
      // Find minimum required plan for this feature
      const requiredPlan = this.getMinimumPlanForFeature(feature)
      
      return {
        hasAccess: false,
        userPlan,
        requiredPlan,
        feature,
        upgradeOptions: this.getUpgradeOptions(userPlan)
      }
      
    } catch (error) {
      console.error('Error checking feature access:', error)
      
      // Fail securely - deny access on errors
      return {
        hasAccess: false,
        userPlan: PlanTier.STARTER,
        feature
      }
    }
  }

  /**
   * Check access based on URL pathname
   */
  static async checkPathAccess(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string,
    pathname: string
  ): Promise<PlanAccessResult> {
    try {
      // Detect feature from pathname
      const feature = this.detectFeatureFromPath(pathname)
      
      if (!feature) {
        // No specific feature detected, allow access
        const userPlan = await this.getUserPlan(supabase, userId)
        return {
          hasAccess: true,
          userPlan
        }
      }
      
      // Check access to detected feature
      return await this.checkFeatureAccess(supabase, userId, feature)
      
    } catch (error) {
      console.error('Error checking path access:', error)
      
      return {
        hasAccess: false,
        userPlan: PlanTier.STARTER
      }
    }
  }

  /**
   * Get user's current plan with caching
   */
  private static async getUserPlan(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string
  ): Promise<PlanTier> {
    // Check cache first
    const cached = this.planCache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      // Record cache hit
      try {
        // Dynamic import to avoid circular dependencies
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PerformanceMonitor } = require('./performance-monitor')
        PerformanceMonitor.recordCacheHit('plan', true)
      } catch {
        // Performance monitoring not available, continue silently
      }
      return cached.plan
    }
    
    // Record cache miss
    try {
      // Dynamic import to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PerformanceMonitor } = require('./performance-monitor')
      PerformanceMonitor.recordCacheHit('plan', false)
    } catch {
      // Performance monitoring not available, continue silently
    }
    
    // Fetch from database
    const { data: wallet, error } = await supabase
      .from('credit_wallet')
      .select('plan_tier')
      .eq('user_id', userId)
      .single()
    
    if (error || !wallet) {
      console.error('Error fetching user plan:', error)
      return PlanTier.STARTER // Default to starter on error
    }
    
    const plan = (wallet.plan_tier as PlanTier) || PlanTier.STARTER
    
    // Cache the result
    this.planCache.set(userId, {
      plan,
      timestamp: Date.now()
    })
    
    return plan
  }

  /**
   * Detect feature category from URL pathname
   */
  private static detectFeatureFromPath(pathname: string): FeatureCategory | null {
    for (const [feature, patterns] of Object.entries(FEATURE_URL_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(pathname))) {
        return feature as FeatureCategory
      }
    }
    
    return null
  }

  /**
   * Find minimum plan required for a feature
   */
  private static getMinimumPlanForFeature(feature: FeatureCategory): PlanTier | undefined {
    for (const [plan, features] of Object.entries(PLAN_FEATURES)) {
      if (features.includes(feature)) {
        return plan as PlanTier
      }
    }
    
    return undefined
  }

  /**
   * Get upgrade options for a plan
   */
  private static getUpgradeOptions(currentPlan: PlanTier): PlanTier[] {
    switch (currentPlan) {
      case PlanTier.STARTER:
        return [PlanTier.PLUS, PlanTier.PRO]
      case PlanTier.PLUS:
        return [PlanTier.PRO]
      case PlanTier.PRO:
        return []
      default:
        return [PlanTier.PLUS, PlanTier.PRO]
    }
  }

  /**
   * Check if user can access bulk operations
   */
  static async canUseBulkOperations(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string
  ): Promise<boolean> {
    const userPlan = await this.getUserPlan(supabase, userId)
    return userPlan === PlanTier.PRO
  }

  /**
   * Check if user can access advanced features
   */
  static async canUseAdvancedFeatures(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string
  ): Promise<boolean> {
    const userPlan = await this.getUserPlan(supabase, userId)
    return userPlan === PlanTier.PLUS || userPlan === PlanTier.PRO
  }

  /**
   * Get plan comparison for upgrade prompts
   */
  static getPlanComparison(): Record<PlanTier, {
    name: string
    features: string[]
    monthlyCredits: number
    price: string
  }> {
    return {
      [PlanTier.STARTER]: {
        name: 'Starter',
        features: [
          'Basic research & insights',
          'Simple content generation',
          'PDF exports',
          'Basic API access'
        ],
        monthlyCredits: 50,
        price: 'Free'
      },
      [PlanTier.PLUS]: {
        name: 'Plus',
        features: [
          'Everything in Starter',
          'Advanced AI features',
          'Custom templates',
          'Advanced sharing',
          'Priority support'
        ],
        monthlyCredits: 500,
        price: '$29/month'
      },
      [PlanTier.PRO]: {
        name: 'Pro',
        features: [
          'Everything in Plus',
          'Bulk operations',
          'Batch processing',
          'Advanced API access',
          'Custom integrations'
        ],
        monthlyCredits: 1500,
        price: '$99/month'
      }
    }
  }

  /**
   * Invalidate plan cache for user
   */
  static invalidateUserPlan(userId: string): void {
    this.planCache.delete(userId)
  }

  /**
   * Clear all plan cache
   */
  static clearPlanCache(): void {
    this.planCache.clear()
  }

  /**
   * Get plan cache statistics
   */
  static getPlanCacheStats(): {
    size: number
    entries: Array<{ userId: string; plan: PlanTier; age: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.planCache.entries()).map(([userId, data]) => ({
      userId,
      plan: data.plan,
      age: now - data.timestamp
    }))
    
    return {
      size: this.planCache.size,
      entries
    }
  }
} 