import { Database } from '@seriously-ai/shared'
import { createServerClient } from '@supabase/ssr'
import { CreditConfig, getCreditCost, type CreditOperation } from './credit-config'

/**
 * Credit check results with detailed information
 */
export interface CreditCheckResult {
  hasCredits: boolean
  currentBalance: number
  requiredCredits: number
  remainingAfter?: number
  planTier: string
  nextRefill?: Date
  canUpgrade: boolean
  upgradeOptions?: string[]
}

/**
 * Cache for credit balances to reduce database load
 */
class CreditCache {
  private cache = new Map<string, { balance: number; planTier: string; timestamp: number }>()
  private readonly TTL = 60 * 1000 // 60 seconds

  set(userId: string, balance: number, planTier: string): void {
    this.cache.set(userId, {
      balance,
      planTier,
      timestamp: Date.now()
    })
  }

  get(userId: string): { balance: number; planTier: string } | null {
    const cached = this.cache.get(userId)
    if (!cached) return null
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId)
      return null
    }
    
    return { balance: cached.balance, planTier: cached.planTier }
  }

  invalidate(userId: string): void {
    this.cache.delete(userId)
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * Enhanced credit checker with caching and detailed validation
 */
export class CreditChecker {
  private static cache = new CreditCache()

  /**
   * Check if user has sufficient credits for a specific operation
   */
  static async checkCredits(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string,
    operation: CreditOperation = 'default'
  ): Promise<CreditCheckResult> {
    try {
      // Try cache first
      const cached = this.cache.get(userId)
      let currentBalance: number
      let planTier: string
      
      if (cached) {
        currentBalance = cached.balance
        planTier = cached.planTier
      } else {
        // Fetch from database
        const { data: wallet, error } = await supabase
          .from('credit_wallet')
          .select('balance, plan_tier, next_refill')
          .eq('user_id', userId)
          .single()
        
        if (error) {
          console.error('Error fetching credit wallet:', error)
          return this.createFailureResult(0, operation, 'starter')
        }
        
        if (!wallet) {
          console.error('No credit wallet found for user:', userId)
          return this.createFailureResult(0, operation, 'starter')
        }
        
        currentBalance = wallet.balance || 0
        planTier = wallet.plan_tier || 'starter'
        
        // Cache the result
        this.cache.set(userId, currentBalance, planTier)
      }
      
      const requiredCredits = getCreditCost(operation)
      const hasCredits = currentBalance >= requiredCredits
      
      return {
        hasCredits,
        currentBalance,
        requiredCredits,
        remainingAfter: hasCredits ? currentBalance - requiredCredits : undefined,
        planTier,
        canUpgrade: planTier !== 'pro',
        upgradeOptions: this.getUpgradeOptions(planTier)
      }
      
    } catch (error) {
      console.error('Exception in credit check:', error)
      return this.createFailureResult(0, operation, 'starter')
    }
  }

  /**
   * Quick check if user has any credits (for middleware performance)
   */
  static async hasAnyCredits(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string
  ): Promise<boolean> {
    try {
      // Try cache first
      const cached = this.cache.get(userId)
      if (cached) {
        return cached.balance > 0
      }
      
      // Quick database check
      const { data: wallet, error } = await supabase
        .from('credit_wallet')
        .select('balance')
        .eq('user_id', userId)
        .single()
      
      if (error || !wallet) {
        return false
      }
      
      const hasCredits = (wallet.balance || 0) > 0
      
      // Cache the result (using default plan for quick checks)
      this.cache.set(userId, wallet.balance || 0, 'starter')
      
      return hasCredits
      
    } catch (error) {
      console.error('Exception in hasAnyCredits check:', error)
      return false
    }
  }

  /**
   * Check credits for multiple operations (batch check)
   */
  static async checkMultipleOperations(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string,
    operations: CreditOperation[]
  ): Promise<Record<CreditOperation, CreditCheckResult>> {
    const results: Record<string, CreditCheckResult> = {}
    
    // Get user's current balance once
    const baseCheck = await this.checkCredits(supabase, userId, 'default')
    
    // Check each operation against the same balance
    for (const operation of operations) {
      const requiredCredits = getCreditCost(operation)
      const hasCredits = baseCheck.currentBalance >= requiredCredits
      
      results[operation] = {
        ...baseCheck,
        requiredCredits,
        hasCredits,
        remainingAfter: hasCredits ? baseCheck.currentBalance - requiredCredits : undefined
      }
    }
    
    return results as Record<CreditOperation, CreditCheckResult>
  }



  /**
   * Invalidate cache for user (call after credit operations)
   */
  static invalidateUserCache(userId: string): void {
    this.cache.invalidate(userId)
  }

  /**
   * Get detailed credit information for UI display
   */
  static async getCreditSummary(
    supabase: ReturnType<typeof createServerClient<Database>>,
    userId: string
  ): Promise<{
    balance: number
    planTier: string
    nextRefill?: Date
    monthlyAllowance: number
    percentUsed: number
  }> {
    try {
      const { data: wallet, error } = await supabase
        .from('credit_wallet')
        .select('balance, plan_tier, next_refill, last_refill')
        .eq('user_id', userId)
        .single()
      
      if (error || !wallet) {
        return {
          balance: 0,
          planTier: 'starter',
          monthlyAllowance: 50,
          percentUsed: 100
        }
      }
      
      const monthlyAllowance = this.getMonthlyAllowance(wallet.plan_tier || 'starter')
      const percentUsed = Math.max(0, Math.min(100, 
        ((monthlyAllowance - (wallet.balance || 0)) / monthlyAllowance) * 100
      ))
      
      return {
        balance: wallet.balance || 0,
        planTier: wallet.plan_tier || 'starter',
        nextRefill: wallet.next_refill ? new Date(wallet.next_refill) : undefined,
        monthlyAllowance,
        percentUsed
      }
      
    } catch (error) {
      console.error('Error getting credit summary:', error)
      return {
        balance: 0,
        planTier: 'starter',
        monthlyAllowance: 50,
        percentUsed: 100
      }
    }
  }

  /**
   * Create a failure result for error cases
   */
  private static createFailureResult(
    balance: number, 
    operation: CreditOperation, 
    planTier: string
  ): CreditCheckResult {
    return {
      hasCredits: false,
      currentBalance: balance,
      requiredCredits: getCreditCost(operation),
      planTier,
      canUpgrade: planTier !== 'pro',
      upgradeOptions: this.getUpgradeOptions(planTier)
    }
  }

  /**
   * Get upgrade options based on current plan
   */
  private static getUpgradeOptions(currentPlan: string): string[] {
    switch (currentPlan) {
      case 'starter':
        return ['plus', 'pro']
      case 'plus':
        return ['pro']
      case 'pro':
        return []
      default:
        return ['plus', 'pro']
    }
  }

  /**
   * Get monthly credit allowance by plan
   */
  private static getMonthlyAllowance(planTier: string): number {
    switch (planTier) {
      case 'starter': return 50
      case 'plus': return 500
      case 'pro': return 1500
      default: return 50
    }
  }
}

/**
 * Export convenience functions
 */
export const {
  checkCredits,
  hasAnyCredits,
  checkMultipleOperations,
  invalidateUserCache,
  getCreditSummary
} = CreditChecker

// Re-export from credit-config for convenience
export { getOperationFromPath } from './credit-config' 