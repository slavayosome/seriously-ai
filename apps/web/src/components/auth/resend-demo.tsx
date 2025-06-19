'use client'

import { useState } from 'react'
import { ResendTimer } from './resend-timer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ResendDemo() {
  const [demoState, setDemoState] = useState<'ready' | 'sent' | 'cooldown'>('ready')
  const [resetKey, setResetKey] = useState(0)

  const handleSendCode = async () => {
    setDemoState('sent')
    // Simulate sending a code
    await new Promise(resolve => setTimeout(resolve, 1000))
    setDemoState('cooldown')
  }

  const handleResend = async () => {
    // Simulate resending
    await new Promise(resolve => setTimeout(resolve, 500))
    return Promise.resolve()
  }

  const resetDemo = () => {
    setDemoState('ready')
    setResetKey(prev => prev + 1)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Resend Timer Demo</CardTitle>
        <CardDescription>
          Test the resend functionality with real-time countdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {demoState === 'ready' && (
          <Button onClick={handleSendCode} className="w-full">
            Send Verification Code
          </Button>
        )}

        {demoState === 'sent' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sending code...
            </p>
          </div>
        )}

        {demoState === 'cooldown' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Code sent! The resend button should show a countdown timer.
              </p>
            </div>
            
            <ResendTimer
              key={resetKey}
              onResend={handleResend}
              initialCooldown={10} // Short cooldown for demo
              maxAttempts={3}
              resendText="Resend code"
              cooldownText="Wait {time}s"
              variant="outline"
              className="w-full"
              startWithCooldown={true}
            />
            
            <Button 
              onClick={resetDemo} 
              variant="ghost" 
              className="w-full text-sm"
            >
              Reset Demo
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p><strong>Expected behavior:</strong></p>
          <ul className="text-left space-y-1 mt-2">
            <li>• Button shows &quot;Wait 10s&quot;, &quot;Wait 9s&quot;, etc.</li>
            <li>• Button is disabled during countdown</li>
            <li>• Shows clock icon during cooldown</li>
            <li>• Button becomes clickable after countdown</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 