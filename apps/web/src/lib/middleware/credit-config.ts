/**
 * Credit Configuration System
 * Centralized management of credit costs for different operations
 * Designed to be easily extended with dynamic pipeline configurations
 */

export type CreditOperation = 
  // Core operations
  | 'research-pipeline'
  | 'research-query' 
  | 'research-analysis'
  | 'insight-generation'
  | 'insight-analysis'
  | 'insight-enhancement'
  | 'draft-generation'
  | 'draft-enhancement'
  | 'draft-rewrite'
  | 'template-application'
  // AI operations
  | 'pipeline-execution'
  | 'batch-processing'
  | 'custom-pipeline'
  // Dynamic pipeline operations (will be added later)
  | `pipeline:${string}`
  // Fallback
  | 'default'

/**
 * Default credit costs for core operations
 * These will be the base costs before pipeline-specific configurations
 */
const DEFAULT_CREDIT_COSTS: Record<string, number> = {
  // Research operations
  'research-pipeline': 5,
  'research-query': 3,
  'research-analysis': 4,
  
  // Insight operations  
  'insight-generation': 2,
  'insight-analysis': 1,
  'insight-enhancement': 1,
  
  // Draft operations
  'draft-generation': 3,
  'draft-enhancement': 2,
  'draft-rewrite': 2,
  'template-application': 1,
  
  // AI pipeline operations (base costs)
  'pipeline-execution': 10,
  'batch-processing': 15,
  'custom-pipeline': 8,
  
  // Default cost for unknown operations
  'default': 1
}

/**
 * Pipeline-specific cost overrides
 * This will be populated from pipeline config files in the future
 */
interface PipelineConfig {
  id: string
  name: string
  creditCost: number
  description?: string
  category?: string
}

/**
 * Credit configuration manager
 * Handles both static and dynamic cost calculations
 */
export class CreditConfig {
  private static pipelineConfigs: Map<string, PipelineConfig> = new Map()
  
  /**
   * Get credit cost for a specific operation
   */
  static getCreditCost(operation: CreditOperation): number {
    // Handle dynamic pipeline operations
    if (operation.startsWith('pipeline:')) {
      const pipelineId = operation.replace('pipeline:', '')
      const pipelineConfig = this.pipelineConfigs.get(pipelineId)
      
      if (pipelineConfig) {
        return pipelineConfig.creditCost
      }
      
      // Fallback to base pipeline cost if specific pipeline not found
      return DEFAULT_CREDIT_COSTS['pipeline-execution'] || DEFAULT_CREDIT_COSTS['default']
    }
    
    // Handle standard operations
    return DEFAULT_CREDIT_COSTS[operation] || DEFAULT_CREDIT_COSTS['default']
  }
  
  /**
   * Register a pipeline configuration
   * This will be called when pipeline configs are loaded
   */
  static registerPipeline(config: PipelineConfig): void {
    this.pipelineConfigs.set(config.id, config)
  }
  
  /**
   * Register multiple pipeline configurations
   */
  static registerPipelines(configs: PipelineConfig[]): void {
    configs.forEach(config => this.registerPipeline(config))
  }
  
  /**
   * Get all registered pipeline configurations
   */
  static getPipelineConfigs(): PipelineConfig[] {
    return Array.from(this.pipelineConfigs.values())
  }
  
  /**
   * Get pipeline configuration by ID
   */
  static getPipelineConfig(pipelineId: string): PipelineConfig | undefined {
    return this.pipelineConfigs.get(pipelineId)
  }
  
  /**
   * Clear all pipeline configurations (for testing/reloading)
   */
  static clearPipelineConfigs(): void {
    this.pipelineConfigs.clear()
  }
  
  /**
   * Load pipeline configurations from external source
   * This will be implemented when we have the pipeline system
   */
  static async loadPipelineConfigs(): Promise<void> {
    // TODO: Implement when pipeline config system is built
    // This might load from:
    // - Database (pipeline_configs table)
    // - File system (pipeline config files)
    // - External API (pipeline registry)
    
    // For now, we can register some example configurations
    // to demonstrate the system works
    if (process.env.NODE_ENV === 'development') {
      this.registerPipelines([
        {
          id: 'research-deep-dive',
          name: 'Deep Research Pipeline',
          creditCost: 15,
          description: 'Comprehensive research with multiple sources',
          category: 'research'
        },
        {
          id: 'content-generation',
          name: 'Content Generation Pipeline',
          creditCost: 8,
          description: 'AI-powered content creation',
          category: 'content'
        },
        {
          id: 'data-analysis',
          name: 'Data Analysis Pipeline',
          creditCost: 12,
          description: 'Advanced data processing and insights',
          category: 'analysis'
        }
      ])
    }
  }
  
  /**
   * Get operation type from URL path
   * Enhanced to handle dynamic pipeline detection
   */
  static getOperationFromPath(pathname: string): CreditOperation {
    // Handle API routes first (more specific)
    if (pathname.includes('/api/')) {
      if (pathname.includes('/api/research')) return 'research-pipeline'
      if (pathname.includes('/api/insights')) return 'insight-generation'
      if (pathname.includes('/api/drafts')) return 'draft-generation'
      if (pathname.includes('/api/generate')) return 'draft-generation'
      if (pathname.includes('/api/ai')) return 'default'
      
      // Handle dynamic pipeline API routes
      const pipelineMatch = pathname.match(/\/api\/pipeline\/([^\/]+)/)
      if (pipelineMatch) {
        const pipelineId = pipelineMatch[1]
        return `pipeline:${pipelineId}` as CreditOperation
      }
      
      if (pathname.includes('/api/pipeline')) return 'pipeline-execution'
    }
    
    // Handle UI routes
    if (pathname.includes('/research')) {
      if (pathname.includes('/new') || pathname.includes('/create')) {
        return 'research-pipeline'
      }
      return 'research-query'
    }
    
    if (pathname.includes('/insights')) {
      if (pathname.includes('/create') || pathname.includes('/generate')) {
        return 'insight-generation'
      }
      return 'insight-analysis'
    }
    
    if (pathname.includes('/drafts')) {
      if (pathname.includes('/create') || pathname.includes('/generate')) {
        return 'draft-generation'
      }
      return 'draft-enhancement'
    }
    
    // Handle dynamic pipeline UI routes
    const pipelineUIMatch = pathname.match(/\/pipeline\/([^\/]+)/)
    if (pipelineUIMatch) {
      const pipelineId = pipelineUIMatch[1]
      return `pipeline:${pipelineId}` as CreditOperation
    }
    
    if (pathname.includes('/pipeline')) {
      return 'pipeline-execution'
    }
    
    return 'default'
  }
  
  /**
   * Get all available operations with their costs
   * Useful for UI display and documentation
   */
  static getAllOperationsWithCosts(): Record<string, number> {
    const allOperations = { ...DEFAULT_CREDIT_COSTS }
    
    // Add pipeline-specific costs
    this.pipelineConfigs.forEach((config, id) => {
      allOperations[`pipeline:${id}`] = config.creditCost
    })
    
    return allOperations
  }
  
  /**
   * Validate if an operation exists
   */
  static isValidOperation(operation: string): operation is CreditOperation {
    if (operation.startsWith('pipeline:')) {
      const pipelineId = operation.replace('pipeline:', '')
      return this.pipelineConfigs.has(pipelineId)
    }
    
    return operation in DEFAULT_CREDIT_COSTS
  }
}

/**
 * Initialize credit configuration system
 * Call this during app startup
 */
export async function initializeCreditConfig(): Promise<void> {
  await CreditConfig.loadPipelineConfigs()
}

/**
 * Export convenience functions for backward compatibility
 */
export const getCreditCost = CreditConfig.getCreditCost.bind(CreditConfig)
export const getOperationFromPath = CreditConfig.getOperationFromPath.bind(CreditConfig) 