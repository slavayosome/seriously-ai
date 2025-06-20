/**
 * Performance Monitoring API Endpoint
 * Provides access to middleware performance metrics and statistics
 */

import { NextRequest } from 'next/server'
import { PerformanceMonitor, MetricType } from '../../../../src/lib/middleware/performance-monitor'

/**
 * GET /api/monitoring/performance
 * Returns performance statistics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') as MetricType | null
    const limit = parseInt(searchParams.get('limit') || '100')
    const format = searchParams.get('format') || 'summary'

    // Check if user has admin access (implement based on your auth system)
    // For now, we'll allow access but in production you'd want proper auth
    
    if (metric) {
      // Return specific metric data
      const metrics = PerformanceMonitor.getMetrics(metric, limit)
      return Response.json({
        metric,
        data: metrics,
        count: metrics.length
      })
    }

    if (format === 'export') {
      // Return complete export data
      const exportData = PerformanceMonitor.exportMetrics()
      return Response.json(exportData)
    }

    // Return summary statistics
    const stats = PerformanceMonitor.getStats()
    const activeRequests = PerformanceMonitor.getActiveRequestCount()

    return Response.json({
      stats,
      activeRequests,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return Response.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring/performance/reset
 * Resets performance metrics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'reset') {
      // Check if user has admin access
      // For now, we'll allow reset but in production you'd want proper auth
      
      PerformanceMonitor.reset()
      
      return Response.json({
        success: true,
        message: 'Performance metrics reset successfully'
      })
    }

    return Response.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error resetting performance metrics:', error)
    return Response.json(
      { error: 'Failed to reset performance metrics' },
      { status: 500 }
    )
  }
} 