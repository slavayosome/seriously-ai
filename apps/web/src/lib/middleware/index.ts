/**
 * Middleware Module Initialization
 * Centralizes middleware setup and configuration
 */

import { initializeCreditConfig } from './credit-config'

/**
 * Initialize all middleware systems
 * Call this during app startup (e.g., in layout.tsx or middleware.ts)
 */
export async function initializeMiddleware(): Promise<void> {
  try {
    // Initialize credit configuration system
    await initializeCreditConfig()
    
    console.log('✅ Middleware systems initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize middleware systems:', error)
    // Don't throw - allow app to continue with default configurations
  }
}

// Re-export key middleware components
export { CreditChecker } from './credit-checker'
export { CreditConfig, getCreditCost, getOperationFromPath } from './credit-config'
export { RouteProtectionMatcher, ProtectionLevel } from './route-config'
export { RedirectHandler, RedirectReason } from './redirect-handler'
export { PlanAccessChecker, PlanTier, FeatureCategory } from './plan-access-checker'
export { MiddlewareErrorHandler, ErrorCategory, ErrorSeverity } from './error-handler'
export type { CreditOperation } from './credit-config'
export type { PlanAccessResult } from './plan-access-checker'
export type { MiddlewareError } from './error-handler' 