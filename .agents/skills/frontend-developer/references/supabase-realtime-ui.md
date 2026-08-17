# Supabase Realtime & Optimistic UI Guide

## 1. Setting up WebSocket Channels

Always manage subscriptions inside `useEffect` and clean up on component unmount:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Email } from '@/types/database';

export function useRealtimeEmails(initialEmails: Email[], accountId?: string) {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const supabase = createClient();

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime:emails')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          ...(accountId ? { filter: `account_id=eq.${accountId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmails((prev) => [payload.new as Email, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEmails((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as Email) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setEmails((prev) => prev.filter((item) => item.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, accountId]);

  return { emails, setEmails };
}
```

---

## 2. Optimistic UI Updates

Update the client state immediately upon user action, then reconcile with the server response:

```tsx
export function DraftEditor({ draft, onApprove }: { draft: Draft; onApprove: (id: string) => Promise<void> }) {
  const [isApproving, setIsApproving] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(draft.status);

  const handleApprove = async () => {
    setOptimisticStatus('approved');
    setIsApproving(true);
    try {
      await onApprove(draft.id);
    } catch (err) {
      setOptimisticStatus(draft.status); // Revert on failure
      console.error('Failed to approve draft:', err);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div>
      <span className="badge">{optimisticStatus}</span>
      <button onClick={handleApprove} disabled={isApproving || optimisticStatus === 'approved'}>
        {isApproving ? 'Approving...' : 'Approve Reply'}
      </button>
    </div>
  );
}
```
