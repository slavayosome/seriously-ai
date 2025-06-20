/**
 * Performance Monitoring for Middleware
 * Tracks execution times, request patterns, and system performance
 */

import { ProtectionLevel } from './route-config'
import { ErrorCategory } from './error-handler'

/**
 * Performance metric types
 */
export enum MetricType {
  // Timing metrics
  MIDDLEWARE_DURATION = 'middleware_duration',
  AUTH_CHECK_DURATION = 'auth_check_duration',
  CREDIT_CHECK_DURATION = 'credit_check_duration',
  PLAN_CHECK_DURATION = 'plan_check_duration',
  ROUTE_MATCH_DURATION = 'route_match_duration',
  
  // Counter metrics
  REQUEST_COUNT = 'request_count',
  ERROR_COUNT = 'error_count',
  REDIRECT_COUNT = 'redirect_count',
  CACHE_HIT_COUNT = 'cache_hit_count',
  CACHE_MISS_COUNT = 'cache_miss_count',
  
  // System metrics
  MEMORY_USAGE = 'memory_usage',
  ROUTE_CACHE_SIZE = 'route_cache_size',
  PLAN_CACHE_SIZE = 'plan_cache_size'
}

/**
 * Performance alert levels
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * Performance metric data structure
 */
export interface PerformanceMetric {
  type: MetricType
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * Request performance context
 */
export interface RequestContext {
  requestId: string
  pathname: string
  protectionLevel?: ProtectionLevel
  userAgent?: string
  startTime: number
  checkpoints: Map<string, number>
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalRequests: number
  averageLatency: number
  p95Latency: number
  errorRate: number
  cacheHitRate: number
  memoryUsage: number
  uptime: number
}

/**
 * Performance monitoring system
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, PerformanceMetric[]>()
  private static activeRequests = new Map<string, RequestContext>()
  private static startTime = Date.now()
  
  // Performance thresholds
  private static readonly ALERT_THRESHOLDS = {
    SLOW_REQUEST: 1000, // 1 second
    VERY_SLOW_REQUEST: 2000, // 2 seconds
    HIGH_ERROR_RATE: 0.05, // 5%
    LOW_CACHE_HIT_RATE: 0.7, // 70%
    HIGH_MEMORY_USAGE: 100 * 1024 * 1024 // 100MB
  }

  /**
   * Initialize performance monitoring
   */
  static initialize(): void {
    // Start periodic cleanup and reporting
    this.startPeriodicTasks()
    console.info('Performance monitoring initialized')
  }

  /**
   * Start monitoring a request
   */
  static startRequest(requestId: string, pathname: string, userAgent?: string): RequestContext {
    const context: RequestContext = {
      requestId,
      pathname,
      userAgent,
      startTime: performance.now(),
      checkpoints: new Map()
    }
    
    this.activeRequests.set(requestId, context)
    this.recordMetric(MetricType.REQUEST_COUNT, 1, { pathname })
    
    return context
  }

  /**
   * Add a checkpoint to track sub-operation timing
   */
  static checkpoint(requestId: string, name: string): void {
    const context = this.activeRequests.get(requestId)
    if (context) {
      context.checkpoints.set(name, performance.now() - context.startTime)
    }
  }

  /**
   * Complete request monitoring
   */
  static completeRequest(
    requestId: string, 
    protectionLevel: ProtectionLevel,
    success: boolean = true,
    errorCategory?: ErrorCategory
  ): void {
    const context = this.activeRequests.get(requestId)
    if (!context) return

    const totalDuration = performance.now() - context.startTime
    
    // Record main metrics
    this.recordMetric(MetricType.MIDDLEWARE_DURATION, totalDuration, {
      pathname: context.pathname,
      protectionLevel,
      success
    })

    // Record checkpoint durations
    context.checkpoints.forEach((duration, name) => {
      const metricType = this.getCheckpointMetricType(name)
      if (metricType) {
        this.recordMetric(metricType, duration, { pathname: context.pathname })
      }
    })

    // Record errors
    if (!success && errorCategory) {
      this.recordMetric(MetricType.ERROR_COUNT, 1, {
        pathname: context.pathname,
        errorCategory
      })
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(totalDuration, context)

    // Clean up
    this.activeRequests.delete(requestId)
  }

  /**
   * Record a performance metric
   */
  static recordMetric(type: MetricType, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      type,
      value,
      timestamp: Date.now(),
      metadata
    }

    const key = type.toString()
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const metrics = this.metrics.get(key)!
    metrics.push(metric)

    // Keep only recent metrics (last 1000 entries)
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000)
    }
  }

  /**
   * Record cache hit/miss
   */
  static recordCacheHit(cacheType: string, hit: boolean): void {
    const metricType = hit ? MetricType.CACHE_HIT_COUNT : MetricType.CACHE_MISS_COUNT
    this.recordMetric(metricType, 1, { cacheType })
  }

  /**
   * Record redirect
   */
  static recordRedirect(pathname: string, reason: string, destination: string): void {
    this.recordMetric(MetricType.REDIRECT_COUNT, 1, {
      pathname,
      reason,
      destination
    })
  }

  /**
   * Get performance statistics
   */
  static getStats(): PerformanceStats {
    const now = Date.now()
    const uptime = now - this.startTime

    // Calculate request metrics
    const requestMetrics = this.metrics.get(MetricType.REQUEST_COUNT) || []
    const durationMetrics = this.metrics.get(MetricType.MIDDLEWARE_DURATION) || []
    const errorMetrics = this.metrics.get(MetricType.ERROR_COUNT) || []
    const cacheHitMetrics = this.metrics.get(MetricType.CACHE_HIT_COUNT) || []
    const cacheMissMetrics = this.metrics.get(MetricType.CACHE_MISS_COUNT) || []

    // Calculate totals
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalCacheHits = cacheHitMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalCacheMisses = cacheMissMetrics.reduce((sum, m) => sum + m.value, 0)

    // Calculate averages
    const durations = durationMetrics.map(m => m.value).sort((a, b) => a - b)
    const averageLatency = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0
    
    const p95Index = Math.floor(durations.length * 0.95)
    const p95Latency = durations.length > 0 ? durations[p95Index] || 0 : 0

    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0
    const cacheHitRate = (totalCacheHits + totalCacheMisses) > 0 
      ? totalCacheHits / (totalCacheHits + totalCacheMisses) 
      : 0

    // Get memory usage (if available)
    const memoryUsage = this.getMemoryUsage()

    return {
      totalRequests,
      averageLatency,
      p95Latency,
      errorRate,
      cacheHitRate,
      memoryUsage,
      uptime
    }
  }

  /**
   * Get detailed metrics by type
   */
  static getMetrics(type: MetricType, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(type.toString()) || []
    return metrics.slice(-limit)
  }

  /**
   * Get active request count
   */
  static getActiveRequestCount(): number {
    return this.activeRequests.size
  }

  /**
   * Export performance data for external monitoring
   */
  static exportMetrics(): Record<string, any> {
    const stats = this.getStats()
    const activeRequests = this.getActiveRequestCount()
    
    return {
      timestamp: Date.now(),
      stats,
      activeRequests,
      alerts: this.checkAllAlerts(),
      systemInfo: {
        uptime: stats.uptime,
        memoryUsage: stats.memoryUsage,
        cacheStats: {
          routeCache: this.getRouteCacheSize(),
          planCache: this.getPlanCacheSize()
        }
      }
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  static reset(): void {
    this.metrics.clear()
    this.activeRequests.clear()
    this.startTime = Date.now()
  }

  /**
   * Private helper methods
   */
  private static startPeriodicTasks(): void {
    // Only start periodic tasks in production
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Clean up old metrics every 5 minutes
      setInterval(() => {
        this.cleanupOldMetrics()
      }, 5 * 60 * 1000)

      // Record system metrics every minute
      setInterval(() => {
        this.recordSystemMetrics()
      }, 60 * 1000)
    }
  }

  private static cleanupOldMetrics(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    this.metrics.forEach((metrics, key) => {
      const filtered = metrics.filter(m => now - m.timestamp < maxAge)
      this.metrics.set(key, filtered)
    })
  }

  private static recordSystemMetrics(): void {
    // Record memory usage
    this.recordMetric(MetricType.MEMORY_USAGE, this.getMemoryUsage())
    
    // Record cache sizes
    this.recordMetric(MetricType.ROUTE_CACHE_SIZE, this.getRouteCacheSize())
    this.recordMetric(MetricType.PLAN_CACHE_SIZE, this.getPlanCacheSize())
  }

  private static getCheckpointMetricType(name: string): MetricType | null {
    const mapping: Record<string, MetricType> = {
      'auth_check': MetricType.AUTH_CHECK_DURATION,
      'credit_check': MetricType.CREDIT_CHECK_DURATION,
      'plan_check': MetricType.PLAN_CHECK_DURATION,
      'route_match': MetricType.ROUTE_MATCH_DURATION
    }
    
    return mapping[name] || null
  }

  private static checkPerformanceAlerts(duration: number, context: RequestContext): void {
    // Check duration alerts
    if (duration > this.ALERT_THRESHOLDS.VERY_SLOW_REQUEST) {
      this.triggerAlert(AlertLevel.CRITICAL, 
        `Very slow request: ${context.pathname} took ${duration.toFixed(2)}ms`
      )
    } else if (duration > this.ALERT_THRESHOLDS.SLOW_REQUEST) {
      this.triggerAlert(AlertLevel.WARNING, 
        `Slow request: ${context.pathname} took ${duration.toFixed(2)}ms`
      )
    }
  }

  private static checkAllAlerts(): Array<{ level: AlertLevel; message: string; value: number }> {
    const alerts = []
    const stats = this.getStats()

    // Check error rate
    if (stats.errorRate > this.ALERT_THRESHOLDS.HIGH_ERROR_RATE) {
      alerts.push({
        level: AlertLevel.CRITICAL,
        message: `High error rate: ${(stats.errorRate * 100).toFixed(2)}%`,
        value: stats.errorRate
      })
    }

    // Check cache hit rate
    if (stats.cacheHitRate > 0 && stats.cacheHitRate < this.ALERT_THRESHOLDS.LOW_CACHE_HIT_RATE) {
      alerts.push({
        level: AlertLevel.WARNING,
        message: `Low cache hit rate: ${(stats.cacheHitRate * 100).toFixed(2)}%`,
        value: stats.cacheHitRate
      })
    }

    // Check memory usage
    if (stats.memoryUsage > this.ALERT_THRESHOLDS.HIGH_MEMORY_USAGE) {
      alerts.push({
        level: AlertLevel.WARNING,
        message: `High memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        value: stats.memoryUsage
      })
    }

    return alerts
  }

  private static triggerAlert(level: AlertLevel, message: string): void {
    const logMethod = level === AlertLevel.CRITICAL ? console.error : 
                     level === AlertLevel.WARNING ? console.warn : console.info
    
    logMethod(`Performance Alert [${level.toUpperCase()}]: ${message}`)
  }

  private static getMemoryUsage(): number {
    try {
      // For Node.js environments
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed
      }
      
      // For browser environments (limited support)
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        return (performance as any).memory.usedJSHeapSize || 0
      }
      
      return 0
    } catch {
      return 0
    }
  }

  private static getRouteCacheSize(): number {
    try {
      // This would need to be integrated with RouteProtectionMatcher
      const { RouteProtectionMatcher } = require('./route-config')
      return RouteProtectionMatcher.getCacheStats().size
    } catch {
      return 0
    }
  }

  private static getPlanCacheSize(): number {
    try {
      // This would need to be integrated with PlanAccessChecker
      const { PlanAccessChecker } = require('./plan-access-checker')
      return PlanAccessChecker.getPlanCacheStats().size
    } catch {
      return 0
    }
  }
}

/**
 * Initialize performance monitoring on module load
 */
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  PerformanceMonitor.initialize()
} 