# Next.js 16 App Router & RSC Guide

## 1. Server vs Client Component Boundaries

### Server Components (Default)
Use for:
- Fetching initial page data from database or APIs
- Accessing backend resources directly (headers, cookies, env vars)
- Keeping large dependencies server-side (markdown parsers, date formatters)
- Improving First Contentful Paint (FCP) and reducing client bundle size

```tsx
// app/page.tsx (Server Component)
import { createServerClient } from '@/lib/supabase/server';
import { InboxView } from '@/components/inbox/inbox-view';

export default async function Page() {
  const supabase = await createServerClient();
  const { data: initialEmails } = await supabase
    .from('emails')
    .select('*')
    .order('received_at', { ascending: false });

  return <InboxView initialEmails={initialEmails ?? []} />;
}
```

### Client Components (`'use client'`)
Use only for:
- Interactivity with `onClick`, `onChange`, `onSubmit`
- State hooks (`useState`, `useReducer`, `useActionState`)
- Lifecycle & effect hooks (`useEffect`, `useLayoutEffect`)
- Supabase Realtime subscriptions & browser WebSockets
- Browser-only APIs (localStorage, window, audio playback)

```tsx
// components/inbox/inbox-view.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function InboxView({ initialEmails }: { initialEmails: Email[] }) {
  const [emails, setEmails] = useState(initialEmails);
  // Realtime subscription and state handling
}
```

---

## 2. Server Actions & Mutations

Always handle form submissions and mutations with Server Actions for progressive enhancement:

```tsx
// app/actions/drafts.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveDraft(draftId: string, editedText: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from('drafts')
    .update({
      status: 'approved',
      edited_text: editedText,
      approved_at: new Date().toISOString()
    })
    .eq('id', draftId);

  if (error) throw new Error(error.message);
  revalidatePath('/emails');
  return { success: true };
}
```

---

## 3. Streaming, Suspense & Loading UI

Use `loading.tsx` and `<Suspense>` boundaries to stream UI sections independently:

```tsx
import { Suspense } from 'react';
import { InboxListSkeleton } from '@/components/ui/skeletons';
import { EmailFeed } from '@/components/inbox/email-feed';

export default function InboxPage() {
  return (
    <main className="flex-1 p-6">
      <h1 className="text-xl font-semibold text-fg">Inbox</h1>
      <Suspense fallback={<InboxListSkeleton />}>
        <EmailFeed />
      </Suspense>
    </main>
  );
}
```

---

## 4. Route Protection & Middleware

Keep middleware minimal and fast. Use `@supabase/ssr` to refresh session cookies in `middleware.ts`:

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```
