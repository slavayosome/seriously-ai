'use client'

import { AuthForm, GoogleButton, MagicLinkForm, OTPForm } from '@/components/auth'
import { ResendDemo } from '@/components/auth/resend-demo'

export default function AuthComponentsDemo() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Auth Components Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test the authentication components and their functionality
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Resend Timer Component</h2>
        <ResendDemo />
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Auth Components Demo</h1>
          <p className="text-muted-foreground">
            Showcasing the reusable authentication components
          </p>
        </div>

        {/* Google Button Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">GoogleButton Component</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Default</h3>
              <GoogleButton />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Full Width</h3>
              <GoogleButton fullWidth />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Text</h3>
              <GoogleButton>Sign up with Google</GoogleButton>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Disabled</h3>
              <GoogleButton disabled />
            </div>
          </div>
        </section>

        {/* OTP Form Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">OTPForm Component (New)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Default Form</h3>
              <div className="max-w-sm">
                <OTPForm />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Labels</h3>
              <div className="max-w-sm">
                <OTPForm
                  labelText="Your work email"
                  placeholder="you@company.com"
                  buttonText="Continue with email"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Magic Link Form Examples (Legacy) */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">MagicLinkForm Component (Legacy)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Default Form</h3>
              <div className="max-w-sm">
                <MagicLinkForm />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Labels</h3>
              <div className="max-w-sm">
                <MagicLinkForm
                  labelText="Your work email"
                  placeholder="you@company.com"
                  buttonText="Get started"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Auth Form Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">AuthForm Component</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sign In Mode</h3>
              <AuthForm
                mode="signin"
                title="Welcome Back"
                description="Sign in to your account"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sign Up Mode</h3>
              <AuthForm
                mode="signup"
                title="Get Started"
                description="Create your free account"
              />
            </div>
          </div>
        </section>

        {/* Customization Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Customization Options</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Google Only</h3>
              <AuthForm
                mode="signin"
                title="Google Sign In"
                description="Continue with your Google account"
                showMagicLink={false}
                showDivider={false}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">OTP Only</h3>
              <AuthForm
                mode="signin"
                title="Email Sign In"
                description="We'll send you a verification code"
                showGoogleAuth={false}
                showDivider={false}
              />
            </div>
          </div>
        </section>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            This demo page showcases the reusable auth components. 
            Check the console for success/error callbacks.
          </p>
        </div>
      </div>
    </div>
  )
} 