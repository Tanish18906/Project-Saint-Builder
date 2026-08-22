'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f1e8]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-[#e8e2d4] overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#1c1a17] px-6 py-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#f5f1e8]">
            Foreman
          </h1>
          <p className="text-xs uppercase tracking-wider text-[#e8e2d4]/70 mt-1">
            Allsaints Builders Email Assistant
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#1c1a17]">
              Staff sign in
            </h2>
            <p className="text-sm text-[#6b6559] mt-1">
              Sign in with your staff account to review and triage inboxes.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="font-medium">Authentication failed</p>
                <p className="text-xs mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#1c1a17] mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@allsaintsbuilders.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17] focus:border-[#1c1a17]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#1c1a17] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6559]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#e8e2d4] rounded bg-white text-[#1c1a17] placeholder:text-[#6b6559]/50 focus:outline-none focus:ring-1 focus:ring-[#1c1a17] focus:border-[#1c1a17]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 px-4 bg-[#1c1a17] hover:bg-[#2a2723] text-[#f5f1e8] font-medium text-sm rounded transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#e8e2d4] text-center">
            <p className="text-xs text-[#6b6559]">
              Internal authorized access only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
