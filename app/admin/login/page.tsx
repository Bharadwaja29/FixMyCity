'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.')
          return
        }

        setSuccessMessage('Authentication successful. Redirecting to officer console...')
        // Short pause for UX feedback before navigating
        setTimeout(() => {
          router.push(from)
          router.refresh()
        }, 400)
      } catch (err) {
        console.error('Login request failed:', err)
        setErrorMessage('Unable to reach authentication service. Please check your network connection.')
      }
    })
  }

  const fillDemoCredentials = () => {
    setEmail('admin@fixmycity.com')
    setPassword('admin123')
    setErrorMessage(null)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative backdrop paper texture frame */}
      <div className="w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Return to Citizen Portal
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-saffron bg-saffron/15 text-saffron-ink">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xs border border-saffron/40 bg-saffron/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-saffron-ink uppercase">
                Officer Portal
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Bhagalpur Municipal Corp
              </span>
            </div>
            <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Officer Login
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in with your administrative or departmental credentials to access triage, dispatch, and ML insights.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in duration-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success animate-in fade-in duration-200"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-foreground">
                Official Email Address
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="officer@fixmycity.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="h-10 pl-9 text-xs focus-visible:ring-saffron"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="h-10 pl-9 pr-9 text-xs focus-visible:ring-saffron"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-10 w-full bg-primary font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:ring-saffron"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Verifying Credentials...
                </>
              ) : (
                'Sign In to Console'
              )}
            </Button>
          </form>

          {/* Demo Credentials Quick-Fill helper */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <KeyRound className="size-3.5 text-saffron-ink" aria-hidden="true" />
                  <span>Demo Admin Account</span>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="rounded-xs bg-saffron/20 px-2 py-0.5 text-[10px] font-bold text-saffron-ink transition-colors hover:bg-saffron/30"
                >
                  Auto-fill
                </button>
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                <div>Email: <span className="font-semibold text-foreground">admin@fixmycity.com</span></div>
                <div>Pass: <span className="font-semibold text-foreground">admin123</span> (Role: admin)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          Protected by FixMyCity RBAC &bull; Authorized Municipal Personnel Only
        </p>
      </div>
    </div>
  )
}
