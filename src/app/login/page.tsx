'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'
import { toSignInMessage } from '@/lib/user-facing-error'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

const INPUT_CLASS =
  'w-full h-11 pl-9 pr-3 text-body rounded-control border border-border-control bg-surface-raised text-text-primary placeholder:text-text-tertiary transition-[border-color,box-shadow] duration-150 hover:border-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await login(formData)
      if (res?.error) {
        console.error('[Login] Sign-in failed:', res.error)
        setError(toSignInMessage(res.error))
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-surface">
      <div className="w-full max-w-[380px]">
        {/* Wordmark on the page, not in a banner */}
        <div className="mb-6 px-1">
          <p className="text-wordmark font-bold tracking-tight text-text-primary">Foreman</p>
          <p className="text-secondary text-text-secondary mt-0.5">Allsaints Builders · Email triage and approval</p>
        </div>

        <div className="bg-surface-raised rounded-surface border border-border-hairline shadow-sm p-6 sm:p-7">
          <h1 className="text-heading font-semibold text-text-primary">Sign in</h1>
          <p className="text-secondary text-text-secondary mt-1">Use your Allsaints Builders staff account.</p>

          {error && (
            <div
              role="alert"
              className="mt-5 px-3 py-2.5 rounded-control bg-signal-urgent-bg border border-signal-urgent-border text-signal-urgent flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-secondary font-semibold">Couldn’t sign in</p>
                <p className="text-caption mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form action={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-caption font-medium text-text-primary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@allsaintsbuilders.com"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-caption font-medium text-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 mt-1 rounded-control bg-surface-brand hover:bg-surface-brand-hover text-text-on-brand text-secondary font-semibold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-caption text-text-tertiary mt-4 px-1">Internal access for authorised staff only.</p>
      </div>
    </div>
  )
}
