'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'
import { Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await login(formData)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--app-bg)] relative overflow-hidden">
      {/* Subtle Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold text-base tracking-tight shadow-sm">
              F
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-[var(--text-primary)]">
                  Foreman
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--brand-subtle)] text-[var(--brand-text)] border border-[var(--brand-subtle)]">
                  Triage
                </span>
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Allsaints Builders
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] max-w-[280px]">
            Enterprise internal operations & email communication intelligence
          </p>
        </div>

        {/* Authentication Card */}
        <div className="w-full bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-xs p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Sign in to workspace
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enter your staff credentials to access operational triage, drafts, and dispatch controls.
            </p>
          </div>

          {error && (
            <div 
              role="alert" 
              className="p-3.5 rounded-xl bg-[var(--urgency-urgent-bg)] border border-[var(--urgency-urgent-border)] text-[var(--urgency-urgent)] text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--urgency-urgent)]" />
              <div className="space-y-0.5">
                <p className="font-semibold">Authentication failed</p>
                <p className="text-[11px] opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@allsaintsbuilders.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/15 focus:border-[var(--brand)] transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[var(--text-primary)]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/15 focus:border-[var(--brand)] transition-all min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 px-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] active:scale-[0.99] text-white font-medium text-sm rounded-lg transition-all shadow-2xs hover:shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/90" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign in to Foreman</span>
              )}
            </button>
          </form>

          {/* Security & System Status */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[var(--text-secondary)]">All systems normal</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-text)]" />
              <span>TLS 1.3 Encrypted</span>
            </div>
          </div>
        </div>

        {/* Access Disclaimer */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Internal authorized access only • All activity is recorded to the audit ledger
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <CheckCircle2 className="w-3 h-3 text-[var(--brand-text)]" />
            <span>Foreman v1.0 • Allsaints Builders Systems</span>
          </div>
        </div>
      </div>
    </div>
  )
}
