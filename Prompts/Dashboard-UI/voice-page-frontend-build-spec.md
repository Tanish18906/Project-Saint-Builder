# Foreman Voice Page — Frontend Build Spec

**For: coding agent**
**Context:** This is the `/voice/{email_id}` page — the destination of the signed link
sent via WhatsApp for urgent/priority emails (Workflow 3, already built). It lets
staff hear an email read aloud and approve/edit/discard the AI draft entirely by
voice, hands-free, without opening the full dashboard. This is a NEW ROUTE inside the
EXISTING Foreman dashboard Next.js app — not a separate project. It reuses the
dashboard's existing Supabase client and existing approve/discard/save logic; it does
NOT duplicate that logic.

Read `foreman-dashboard-build-spec.md` and `Dashboard-UI_Design-spec.md` before
starting — this page must use the same Supabase schema, same business logic, and
same visual tokens as the rest of the dashboard. Do not modify the Supabase schema.

---

## 1. Route & access control

- **Route:** `app/voice/[email_id]/page.tsx`
- **Access:** this route must be OUTSIDE the normal auth middleware that protects the
  rest of the dashboard (`/`, `/emails/[id]`, `/audit-log`). It does not require a
  logged-in Supabase Auth session.
- **Instead, it requires a valid signed token** passed as a query param:
  `/voice/{email_id}?token=xxx`
- Token validation (server-side, in the page's server component or a route handler
  it calls):
  - Token must be a signed JWT (or equivalent signed payload) containing at minimum
    `email_id` and an expiry timestamp.
  - Verify signature using a server-side secret (env var, e.g. `VOICE_TOKEN_SECRET`
    — never exposed client-side).
  - Verify the token's `email_id` matches the route's `email_id` param — a token for
    one email must not work on another email's URL even if guessed.
  - Verify not expired. Recommend a **short expiry — 24-48 hours** — since this is a
    time-sensitive urgent/priority link, not a permanent bookmark.
  - If invalid/expired/mismatched: show a plain, friendly error state ("This link has
    expired. Please check the dashboard directly.") — no stack traces, no leaking
    why validation failed beyond "invalid or expired."
- **Token generation** (the other half of this) happens in n8n Workflow 3, NOT in
  this Next.js app — this spec is frontend-only. Flag as a dependency: Workflow 3's
  placeholder link (`https://foreman.app/voice/{{email_id}}`) needs updating to
  include a real signed token once both sides exist. Note this as a follow-up
  n8n change, do not build it here.

---

## 2. Visual design — audio-first, minimal reading

This page is used one-handed, often outdoors, often while doing something else. It is
NOT a scaled-down version of the dashboard's detail screen — it's a different mode
entirely.

- Single column, mobile-first (this will almost always be opened on a phone from a
  WhatsApp link — design for a ~375-430px viewport primarily, but don't break on
  desktop).
- Large central elements:
  - A big, unmissable **push-to-talk button** (circular, thumb-sized, center of
    screen) — this is the dominant visual element on the page.
  - A simple state indicator around/near the button: idle / "Listening..." while
    held / "Processing..." after release, using color + a short label, not just color
    alone (accessibility — don't rely on color-only state).
- Minimal text, large font where text does exist:
  - Sender name + subject line only, shown small at the top — enough to visually
    confirm "yes this is the right email" at a glance, not a reading experience.
  - No full email body rendered as text by default. It's heard, not read. (See
    Section 5 — a manual "show text" fallback toggle is fine to include for the case
    where audio genuinely isn't practical, but it should not be the default view.)
- Use the existing brand tokens from `Dashboard-UI_Design-spec.md`
  (`--foreman-charcoal`, `--foreman-cream`, etc.) — this should feel like the same
  product as the dashboard, not a disconnected experience. Category color for
  urgent/priority badge should match the existing category color tokens.
- No dashboard chrome (no header nav, no sidebar, no login state) — this is a
  standalone focused screen, intentionally stripped down.

---

## 3. Page flow

### On load:
1. Validate token (Section 1). If invalid, show error state and stop.
2. Fetch the `emails` row (by `email_id`) and its linked `drafts` row from Supabase.
3. Fetch category/routed_role metadata for the small header display.
4. **Auto-play TTS of the ORIGINAL EMAIL BODY only** (not the draft) as soon as the
   page is ready — per confirmed behavior, the draft is read only if asked. Show a
   subtle "🔊 Playing email..." indicator while this plays.
5. After the original email finishes playing, the page sits idle, push-to-talk button
   active, waiting for input.

### Push-to-talk interaction:
1. User presses and holds the mic button → start recording (MediaRecorder API,
   browser mic permission — request this permission proactively on page load with a
   clear pre-permission explanation, not a silent browser popup, since a cold
   permission prompt on a page opened from WhatsApp will confuse people).
2. User releases → stop recording, send audio to Whisper for transcription (see
   Section 6 for command/dictation routing logic).
3. While processing: show "Processing..." state, do not let them start a new
   recording until this resolves.
4. Result determines next action — see Section 6.

### Reading the draft (on request):
- If the user's spoken input matches a "read the draft" trigger phrase (e.g. "read
  the draft," "what's the reply," "play the draft") → TTS reads
  `drafts.edited_text` (falling back to `ai_generated_text` if null), same as the
  dashboard's fallback logic.

---

## 4. Command / dictation split (confirmed approach)

This is the core interaction logic — implement it exactly as decided, not as an
AI-classification problem:

**Fixed command phrase list** — match transcribed text (case-insensitive, allow
minor variation) against this small set. Start with these five, expand later only if
real usage shows gaps:

| Trigger phrase (and close variants) | Action |
|---|---|
| "read the draft" / "play the draft" / "what's the reply" | TTS reads current `edited_text` |
| "make it more formal" | Send current draft + email context to OpenAI with a rewrite instruction (formal tone), update `edited_text`, TTS reads the new version back |
| "make it shorter" | Same pattern — rewrite instruction: shorten, update `edited_text`, TTS reads back |
| "make it more technical" | Same pattern — rewrite instruction: technical/direct tone, update `edited_text`, TTS reads back |
| "approve and send" / "send it" / "approve" | Calls the EXISTING approve function (same one the dashboard's Approve & Send button calls) — sets `status = approved`, `approved_at`, inserts audit_log `action = approved`. Confirm with a short TTS/visual "Approved and sending" before or after the call. |
| "discard" | Calls the EXISTING discard flow (same logic the dashboard uses) — clears working text, sets local flag for manual-tagging, per Section 6 of the dashboard build spec |

- **Anything that does NOT match a command phrase** → treated as **dictation**: the
  transcribed text becomes the new `edited_text` directly (no AI rewrite), same as if
  they'd typed it into the dashboard textarea. This should be an UPDATE to
  `drafts.edited_text`, same call the dashboard's "Save Draft" makes — reuse it, do
  not build a second write path.
- After a dictation update, TTS reads the newly saved text back so they can confirm
  it was transcribed correctly, then waits for the next push-to-talk input (likely
  "approve and send" or another edit).
- Command matching should be a simple string/pattern check (a small function, not an
  AI call) — keep this fast and predictable. Do this BEFORE deciding whether to route
  to Whisper-only (dictation) vs Whisper+GPT (command rewrite).

---

## 5. Fallback / accessibility

- Include a small, unobtrusive **"Show text instead"** toggle/link (not default-on)
  for cases where audio truly isn't practical (loud environment, hearing difficulty,
  awkward moment to have a phone talking) — reveals the email body and draft text as
  plain readable text, with the same push-to-talk and command logic still available,
  OR standard tap-to-edit textarea + buttons as a secondary path. Use your judgment on
  how much dashboard-style UI to surface here — simplest working option, don't
  over-build this fallback path, it's secondary to the primary voice flow.
- Show a clear mic-permission-denied state if the browser blocks microphone access,
  with a short explanation and a link to the "Show text instead" fallback so the page
  isn't a dead end.

---

## 6. State after action

- Once **approved** or **discarded-and-sent**, the page should reflect a clear final
  state (e.g. "✅ Approved and sent" or "Discarded — reply cleared") and stop
  accepting further push-to-talk input — mirror the dashboard's existing
  post-approval lockdown behavior (Section 6 of the build spec / already verified in
  the dashboard). Do not allow re-approval or re-editing from this page once the
  draft's status has moved past `pending`.
- If someone reopens the same link after the draft is already approved/sent, show
  the final state directly (skip the TTS auto-play of the original email — no need
  to re-read something already handled) plus a short note e.g. "This was already
  approved by [name] at [time]" if that data is available from `drafts.approved_by`
  joined to `users.name`.

---

## 7. Technical notes

- **TTS:** OpenAI TTS API, called server-side (API route), audio streamed/returned to
  the client as playable audio — do not expose the OpenAI key client-side.
- **STT:** OpenAI Whisper API, same pattern — audio blob uploaded to a server route,
  transcribed server-side, text returned to the client.
- **Rewrite commands** (make it more formal/shorter/technical): these call OpenAI
  chat completion server-side, using the SAME tone-aware prompt structure from
  `draft-reply-prompt-with-tone.md` where relevant — i.e., a "make it more formal"
  command should apply the same formal-tone definition already established for
  `director`, not invent a separate tone standard. Reuse the tone definitions, don't
  duplicate them with different wording.
- All Supabase writes (approve, discard, save/dictation) MUST call the same
  functions/logic already built for the dashboard's Approve/Discard/Save buttons —
  do not write parallel/duplicate Supabase update logic for the voice page. If the
  existing dashboard logic isn't easily reusable as a shared function (e.g. it's
  currently inline in a component), refactor it into a shared function first, then
  call that shared function from both the dashboard buttons and this voice page —
  flag this refactor step explicitly if needed.

---

## 8. What NOT to build in this pass

- No token generation (that's an n8n Workflow 3 follow-up, not this page)
- No new Supabase tables/columns
- No changes to existing dashboard screens/routes
- No support for arbitrary free-form voice commands beyond the fixed phrase list —
  do not build an AI intent classifier for this
- No offline support / PWA features
- No support for silence-detection or tap-to-toggle recording — push-to-talk only

---

## 9. Output expected from the coding agent

- New route built and functional: `app/voice/[email_id]/page.tsx` plus any API routes
  needed for TTS/STT/token validation
- Confirmation that Approve/Discard/Save actions call the SAME underlying functions
  as the dashboard (not duplicated logic) — refactored into shared functions if they
  weren't already
- A short summary: what was built, any assumptions made, confirmation of a manual
  test walkthrough (can be tested directly via URL with a manually-crafted valid
  token before real Workflow 3 token generation exists — note how you tested this)
- Flag clearly: the follow-up n8n change still needed (real token generation in
  Workflow 3, replacing the current placeholder link)
