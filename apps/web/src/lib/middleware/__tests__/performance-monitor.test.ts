/**
 * Performance Monitor Tests
 * Tests for middleware performance monitoring functionality
 */

import { AlertLevel, MetricType, PerformanceMonitor } from '../performance-monitor'
import { ProtectionLevel } from '../route-config'
import { ErrorCategory } from '../error-handler'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.reset()
  })

  describe('Request Monitoring', () => {
    it('should start and complete request monitoring', () => {
      const requestId = 'test_req_123'
      const pathname = '/api/test'
      
      // Start monitoring
      const context = PerformanceMonitor.startRequest(requestId, pathname)
      
      expect(context.requestId).toBe(requestId)
      expect(context.pathname).toBe(pathname)
      expect(context.startTime).toBeGreaterThan(0)
      expect(PerformanceMonitor.getActiveRequestCount()).toBe(1)
      
      // Complete monitoring
      PerformanceMonitor.completeRequest(requestId, ProtectionLevel.PUBLIC)
      
      expect(PerformanceMonitor.getActiveRequestCount()).toBe(0)
    })

    it('should record checkpoints during request processing', () => {
      const requestId = 'test_req_123'
      
      PerformanceMonitor.startRequest(requestId, '/api/test')
      
      // Add checkpoints
      PerformanceMonitor.checkpoint(requestId, 'auth_check')
      PerformanceMonitor.checkpoint(requestId, 'credit_check')
      
      PerformanceMonitor.completeRequest(requestId, ProtectionLevel.PAID)
      
      // Check that metrics were recorded
      const authMetrics = PerformanceMonitor.getMetrics(MetricType.AUTH_CHECK_DURATION)
      const creditMetrics = PerformanceMonitor.getMetrics(MetricType.CREDIT_CHECK_DURATION)
      
      expect(authMetrics.length).toBe(1)
      expect(creditMetrics.length).toBe(1)
    })

    it('should record errors when request fails', () => {
      const requestId = 'test_req_123'
      
      PerformanceMonitor.startRequest(requestId, '/api/test')
      PerformanceMonitor.completeRequest(
        requestId, 
        ProtectionLevel.AUTHENTICATED, 
        false, 
        ErrorCategory.AUTH_SESSION_INVALID
      )
      
      const errorMetrics = PerformanceMonitor.getMetrics(MetricType.ERROR_COUNT)
      expect(errorMetrics.length).toBe(1)
      expect(errorMetrics[0].metadata?.errorCategory).toBe(ErrorCategory.AUTH_SESSION_INVALID)
    })
  })

  describe('Metric Recording', () => {
    it('should record various metric types', () => {
      PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1, { pathname: '/test' })
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, 150.5)
      PerformanceMonitor.recordMetric(MetricType.MEMORY_USAGE, 1024 * 1024)
      
      const requestMetrics = PerformanceMonitor.getMetrics(MetricType.REQUEST_COUNT)
      const durationMetrics = PerformanceMonitor.getMetrics(MetricType.MIDDLEWARE_DURATION)
      const memoryMetrics = PerformanceMonitor.getMetrics(MetricType.MEMORY_USAGE)
      
      expect(requestMetrics.length).toBe(1)
      expect(durationMetrics.length).toBe(1)
      expect(memoryMetrics.length).toBe(1)
      expect(durationMetrics[0].value).toBe(150.5)
    })

    it('should record cache hits and misses', () => {
      PerformanceMonitor.recordCacheHit('route', true)
      PerformanceMonitor.recordCacheHit('route', false)
      PerformanceMonitor.recordCacheHit('plan', true)
      
      const hitMetrics = PerformanceMonitor.getMetrics(MetricType.CACHE_HIT_COUNT)
      const missMetrics = PerformanceMonitor.getMetrics(MetricType.CACHE_MISS_COUNT)
      
      expect(hitMetrics.length).toBe(2)
      expect(missMetrics.length).toBe(1)
    })

    it('should record redirects with details', () => {
      PerformanceMonitor.recordRedirect('/protected', 'auth_required', '/auth/login')
      
      const redirectMetrics = PerformanceMonitor.getMetrics(MetricType.REDIRECT_COUNT)
      expect(redirectMetrics.length).toBe(1)
      expect(redirectMetrics[0].metadata).toEqual({
        pathname: '/protected',
        reason: 'auth_required',
        destination: '/auth/login'
      })
    })

    it('should limit metric storage to prevent memory leaks', () => {
      // Record more than the limit (1000)
      for (let i = 0; i < 1200; i++) {
        PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1)
      }
      
      const metrics = PerformanceMonitor.getMetrics(MetricType.REQUEST_COUNT, 2000)
      expect(metrics.length).toBe(1000) // Should be capped at 1000
    })
  })

  describe('Performance Statistics', () => {
    it('should calculate correct performance statistics', () => {
      // Record some sample data
      PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1)
      
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, 100)
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, 200)
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, 300)
      
      PerformanceMonitor.recordMetric(MetricType.ERROR_COUNT, 1)
      
      PerformanceMonitor.recordMetric(MetricType.CACHE_HIT_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.CACHE_HIT_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.CACHE_MISS_COUNT, 1)
      
      const stats = PerformanceMonitor.getStats()
      
      expect(stats.totalRequests).toBe(3)
      expect(stats.averageLatency).toBe(200) // (100 + 200 + 300) / 3
      expect(stats.p95Latency).toBe(300) // 95th percentile
      expect(stats.errorRate).toBe(1/3) // 1 error out of 3 requests
      expect(stats.cacheHitRate).toBe(2/3) // 2 hits out of 3 total
      expect(stats.uptime).toBeGreaterThanOrEqual(0) // Uptime might be 0 in tests due to reset
    })

    it('should handle empty metrics gracefully', () => {
      const stats = PerformanceMonitor.getStats()
      
      expect(stats.totalRequests).toBe(0)
      expect(stats.averageLatency).toBe(0)
      expect(stats.p95Latency).toBe(0)
      expect(stats.errorRate).toBe(0)
      expect(stats.cacheHitRate).toBe(0)
    })
  })

  describe('Alert System', () => {
    it('should export metrics with alerts', () => {
      // Record high error rate
      for (let i = 0; i < 10; i++) {
        PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1)
      }
      for (let i = 0; i < 6; i++) { // 60% error rate
        PerformanceMonitor.recordMetric(MetricType.ERROR_COUNT, 1)
      }
      
      const exported = PerformanceMonitor.exportMetrics()
      
      expect(exported.timestamp).toBeGreaterThan(0)
      expect(exported.stats).toBeDefined()
      expect(exported.alerts).toBeInstanceOf(Array)
      expect(exported.alerts.some(alert => 
        alert.level === AlertLevel.CRITICAL && 
        alert.message.includes('High error rate')
      )).toBe(true)
    })

    it('should detect low cache hit rates', () => {
      // Record low cache hit rate (50%)
      PerformanceMonitor.recordMetric(MetricType.CACHE_HIT_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.CACHE_MISS_COUNT, 1)
      
      const exported = PerformanceMonitor.exportMetrics()
      
      expect(exported.alerts.some(alert => 
        alert.level === AlertLevel.WARNING && 
        alert.message.includes('Low cache hit rate')
      )).toBe(true)
    })
  })

  describe('Request Lifecycle Integration', () => {
    it('should track complete request lifecycle with performance data', async () => {
      const requestId = 'integration_test'
      const pathname = '/api/research'
      
      // Start request
      const context = PerformanceMonitor.startRequest(requestId, pathname)
      expect(context.requestId).toBe(requestId)
      
      // Simulate middleware operations
      await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
      
      PerformanceMonitor.checkpoint(requestId, 'auth_check')
      await new Promise(resolve => setTimeout(resolve, 5))
      
      PerformanceMonitor.checkpoint(requestId, 'credit_check')
      await new Promise(resolve => setTimeout(resolve, 5))
      
      PerformanceMonitor.checkpoint(requestId, 'plan_check')
      
      // Complete successfully
      PerformanceMonitor.completeRequest(requestId, ProtectionLevel.PAID, true)
      
      // Verify metrics were recorded
      const durationMetrics = PerformanceMonitor.getMetrics(MetricType.MIDDLEWARE_DURATION)
      const authMetrics = PerformanceMonitor.getMetrics(MetricType.AUTH_CHECK_DURATION)
      const creditMetrics = PerformanceMonitor.getMetrics(MetricType.CREDIT_CHECK_DURATION)
      const planMetrics = PerformanceMonitor.getMetrics(MetricType.PLAN_CHECK_DURATION)
      
      expect(durationMetrics.length).toBe(1)
      expect(authMetrics.length).toBe(1)
      expect(creditMetrics.length).toBe(1)
      expect(planMetrics.length).toBe(1)
      
      // All durations should be positive
      expect(durationMetrics[0].value).toBeGreaterThan(0)
      expect(authMetrics[0].value).toBeGreaterThan(0)
      expect(creditMetrics[0].value).toBeGreaterThan(0)
      expect(planMetrics[0].value).toBeGreaterThan(0)
    })

    it('should handle failed requests correctly', () => {
      const requestId = 'failed_test'
      
      PerformanceMonitor.startRequest(requestId, '/api/protected')
      PerformanceMonitor.checkpoint(requestId, 'auth_check')
      
      // Fail the request
      PerformanceMonitor.completeRequest(
        requestId, 
        ProtectionLevel.AUTHENTICATED, 
        false, 
        ErrorCategory.AUTH_SESSION_INVALID
      )
      
      const errorMetrics = PerformanceMonitor.getMetrics(MetricType.ERROR_COUNT)
      const durationMetrics = PerformanceMonitor.getMetrics(MetricType.MIDDLEWARE_DURATION)
      
      expect(errorMetrics.length).toBe(1)
      expect(durationMetrics.length).toBe(1)
      expect(durationMetrics[0].metadata?.success).toBe(false)
    })
  })

  describe('Cache Integration', () => {
    it('should track cache performance', () => {
      // Record cache operations
      PerformanceMonitor.recordCacheHit('route_cache', true)
      PerformanceMonitor.recordCacheHit('route_cache', true)
      PerformanceMonitor.recordCacheHit('route_cache', false)
      
      PerformanceMonitor.recordCacheHit('plan_cache', true)
      PerformanceMonitor.recordCacheHit('plan_cache', false)
      
      const stats = PerformanceMonitor.getStats()
      expect(stats.cacheHitRate).toBe(3/5) // 3 hits out of 5 total
      
      const hitMetrics = PerformanceMonitor.getMetrics(MetricType.CACHE_HIT_COUNT)
      const missMetrics = PerformanceMonitor.getMetrics(MetricType.CACHE_MISS_COUNT)
      
      expect(hitMetrics.length).toBe(3)
      expect(missMetrics.length).toBe(2)
    })
  })

  describe('Memory and System Metrics', () => {
    it('should record system metrics', () => {
      PerformanceMonitor.recordMetric(MetricType.MEMORY_USAGE, 50 * 1024 * 1024) // 50MB
      PerformanceMonitor.recordMetric(MetricType.ROUTE_CACHE_SIZE, 150)
      PerformanceMonitor.recordMetric(MetricType.PLAN_CACHE_SIZE, 75)
      
      const memoryMetrics = PerformanceMonitor.getMetrics(MetricType.MEMORY_USAGE)
      const routeCacheMetrics = PerformanceMonitor.getMetrics(MetricType.ROUTE_CACHE_SIZE)
      const planCacheMetrics = PerformanceMonitor.getMetrics(MetricType.PLAN_CACHE_SIZE)
      
      expect(memoryMetrics.length).toBe(1)
      expect(routeCacheMetrics.length).toBe(1)
      expect(planCacheMetrics.length).toBe(1)
      
      expect(memoryMetrics[0].value).toBe(50 * 1024 * 1024)
      expect(routeCacheMetrics[0].value).toBe(150)
      expect(planCacheMetrics[0].value).toBe(75)
    })
  })

  describe('Performance Boundaries', () => {
    it('should handle extreme values gracefully', () => {
      // Test with very large numbers
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, Number.MAX_SAFE_INTEGER)
      PerformanceMonitor.recordMetric(MetricType.MEMORY_USAGE, 0)
      
      const stats = PerformanceMonitor.getStats()
      expect(stats.averageLatency).toBe(Number.MAX_SAFE_INTEGER)
      // Memory usage might be actual system memory, so just check it's a number
      expect(typeof stats.memoryUsage).toBe('number')
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0)
    })

    it('should handle concurrent requests', () => {
      const requests = Array.from({ length: 10 }, (_, i) => `req_${i}`)
      
      // Start all requests
      requests.forEach(reqId => {
        PerformanceMonitor.startRequest(reqId, `/api/test/${reqId}`)
      })
      
      expect(PerformanceMonitor.getActiveRequestCount()).toBe(10)
      
      // Complete half of them
      requests.slice(0, 5).forEach(reqId => {
        PerformanceMonitor.completeRequest(reqId, ProtectionLevel.PUBLIC)
      })
      
      expect(PerformanceMonitor.getActiveRequestCount()).toBe(5)
      
      // Complete the rest
      requests.slice(5).forEach(reqId => {
        PerformanceMonitor.completeRequest(reqId, ProtectionLevel.PUBLIC)
      })
      
      expect(PerformanceMonitor.getActiveRequestCount()).toBe(0)
    })
  })

  describe('Data Export and Analysis', () => {
    it('should export comprehensive performance data', () => {
      // Generate sample data
      PerformanceMonitor.recordMetric(MetricType.REQUEST_COUNT, 1, { pathname: '/api/test' })
      PerformanceMonitor.recordMetric(MetricType.MIDDLEWARE_DURATION, 100)
      PerformanceMonitor.recordMetric(MetricType.CACHE_HIT_COUNT, 1)
      PerformanceMonitor.recordMetric(MetricType.MEMORY_USAGE, 1024 * 1024)
      
      const exported = PerformanceMonitor.exportMetrics()
      
      expect(exported).toHaveProperty('timestamp')
      expect(exported).toHaveProperty('stats')
      expect(exported).toHaveProperty('activeRequests')
      expect(exported).toHaveProperty('alerts')
      expect(exported).toHaveProperty('systemInfo')
      
      expect(exported.stats).toHaveProperty('totalRequests')
      expect(exported.stats).toHaveProperty('averageLatency')
      expect(exported.stats).toHaveProperty('p95Latency')
      expect(exported.stats).toHaveProperty('errorRate')
      expect(exported.stats).toHaveProperty('cacheHitRate')
      expect(exported.stats).toHaveProperty('memoryUsage')
      expect(exported.stats).toHaveProperty('uptime')
      
      expect(exported.systemInfo).toHaveProperty('uptime')
      expect(exported.systemInfo).toHaveProperty('memoryUsage')
      expect(exported.systemInfo).toHaveProperty('cacheStats')
    })
  })
}) 