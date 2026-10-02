# Foreman — Voice Page Redesign & Phase 7 Completion Brief

**Document:** Voice Page Reference-Driven Redesign  
**Project:** Foreman — AI Email Agent / Project Saint Builder  
**Status:** Authoritative implementation brief  
**Scope:** Frontend only  
**Current state:** Phase 7 voice portal is built, but its current UI/UX is not considered complete  
**Next gate:** After this redesign is completed and verified, proceed to **Phase 8 of the existing Frontend-Only Phased Implementation Plan**

---

## 1. Purpose

The current Foreman Voice Page is functionally built, but its visual composition still feels like a collection of separate UI cards rather than a polished, cohesive voice-first workspace.

The redesign must preserve the existing voice functionality and email workflow while substantially improving the **composition, hierarchy, spacing, visual language, interaction states, and perceived product quality**.

The target is **not** a generic futuristic AI interface and is **not** a pure voice-only screen.

The target is:

> **ChatGPT Voice-style simplicity and voice-first hierarchy + ElevenLabs-style professional voice-agent experience + Foreman's AI-generated email draft as a visible work artifact.**

The employee must be able to **use voice and see the AI-generated email draft at the same time**.

---

# 2. Mandatory Design References

Use these two references as the primary inspiration:

### Reference 1 — ChatGPT Voice

Use ChatGPT Voice primarily for:

- Voice-first composition
- Minimal visual chrome
- Strong central voice interaction
- Clear listening / speaking / thinking states
- Calm, premium visual hierarchy
- Making the voice interaction feel like the product rather than a button embedded in a form

Reference:
- ChatGPT Voice / Advanced Voice Mode

### Reference 2 — ElevenLabs Voice Agents

Use ElevenLabs primarily for:

- Professional voice-agent UX
- Clear conversational state
- Strong central voice visualization
- Human-friendly voice interaction
- Professional AI product aesthetic
- Relationship between voice state, conversation and controls

Reference:
- ElevenLabs Voice Agents

### Supporting technical reference — orb-ui

Use orb-ui only as a supporting implementation reference for:

- Voice-state visualization
- Reactive orb behavior
- Idle / listening / thinking / speaking states
- Audio-reactive motion
- Semantic state communicated through animation

Do **not** copy another product's branding, layout, colors, or proprietary visual identity.

The goal is to learn the interaction patterns and design principles and create an original Foreman implementation.

---

# 3. Core Product Concept

The Voice Page should feel like:

> **"I am reviewing and preparing this email with Foreman using my voice."**

It should NOT feel like:

> "I opened a form containing an email, a microphone button, several cards, some pills, and an editor."

The Voice Page has three levels of hierarchy:

### Level 1 — Voice interaction

The voice experience is the primary interaction.

The user should immediately understand:

- Is Foreman ready?
- Is Foreman listening?
- Is Foreman thinking?
- Is Foreman speaking?
- What can I say?

### Level 2 — AI-generated draft

The generated email is the primary work artifact.

The user must be able to see the current draft while using the voice interface.

When the user says:

> "Make it more formal."

the resulting draft should visibly update.

When the user says:

> "The completion date is Friday at 5 PM."

the draft should reflect the spoken information and resolve the relevant placeholder where the existing functionality supports it.

### Level 3 — Email context

The email being reviewed should remain visible as context, but it should not dominate the screen.

---

# 4. Target Information Architecture

The Voice Page should conceptually follow:

```text
EMAIL CONTEXT
      ↓
VOICE EXPERIENCE
      ↓
AI DRAFT
      ↓
REVIEW / APPROVAL ACTIONS
```

On a mobile viewport, the composition should remain vertically comfortable and readable.

On a wider viewport, the implementation may use a more spacious two-zone composition if that improves usability, but do not create unnecessary dashboard-like complexity.

---

# 5. Proposed Voice Page Composition

A strong target structure is:

```text
┌─────────────────────────────────────────────┐
│  ← Back / Inbox                 Voice state │
│                                             │
│  NPH AD FINANCE                             │
│  Overdue Invoice — PAYMENT CERT required    │
│  Finance · Priority · Pending review        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                VOICE AREA                   │
│                                             │
│                     ◉                       │
│               animated voice orb            │
│                                             │
│                  Listening                  │
│             "Tell me what to change..."     │
│                                             │
│       Make it formal    Make it shorter     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ✦ AI GENERATED DRAFT                       │
│  Responding to: recipient@example.com       │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Current AI-generated email draft      │  │
│  │                                       │  │
│  │ We will send the signed PAYMENT      │  │
│  │ CERT for contract ref 88213...       │  │
│  │                                       │  │
│  │ Expect delivery by [INSERT DATE].    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ⚠ Unresolved placeholder                  │
│                                             │
│           Edit draft      Approve & Send    │
└─────────────────────────────────────────────┘
```

This is a conceptual hierarchy, not a requirement to reproduce this exact layout.

---

# 6. Voice Interaction Must Become the Hero

The current large black "HOLD TO SPEAK" button should NOT remain as the dominant visual treatment.

Replace the feeling of a conventional button with a **voice-state visualization**.

The central visual should communicate state.

## Idle

The orb is calm and subtle.

Text:

**Ready**

Secondary instruction:

**Hold to speak**

## Listening

The orb should become visibly active and preferably respond to microphone input if the existing implementation already provides usable audio state.

Text:

**Listening**

Secondary text can indicate:

**I'm listening...**

## Thinking

The orb should transition into a restrained processing state.

Text:

**Thinking**

Avoid excessive spinner-like UI.

## Speaking

The orb should communicate that Foreman is speaking.

Text:

**Speaking**

## Error / disconnected

Use a clear but restrained error state.

Never make the user guess whether the system is listening.

---

# 7. Voice Orb Design Principles

The orb should feel:

- Premium
- Calm
- Responsive
- Soft
- Purposeful
- Integrated into Foreman's visual language

Avoid:

- Neon cyberpunk effects
- Excessive gradients
- Excessive glow
- Random particle effects
- Overly aggressive animation
- A giant black circular button
- Decorative animation that does not communicate state

Animation should have meaning.

For example:

```text
IDLE       → slow breathing
LISTENING  → subtle reactive motion
THINKING   → controlled processing motion
SPEAKING   → smooth audio-reactive motion
ERROR      → restrained warning state
```

If the existing audio implementation does not expose enough data for real audio-reactive animation, use deterministic state-based motion rather than changing backend functionality.

---

# 8. AI Draft Must Remain Visible

This is a hard requirement.

The AI-generated email draft must remain accessible and visually connected to the voice interaction.

The user should NOT have to navigate to another page simply to see what Foreman generated.

The user should be able to:

1. Hear / interact with Foreman.
2. See the current draft.
3. Speak an instruction.
4. See the draft update.
5. Inspect unresolved placeholders.
6. Edit the draft when necessary.
7. Explicitly approve/send through the existing safe UI action.

The draft is not secondary content.

It is the **work product produced by the voice interaction**.

---

# 9. Draft Presentation

The current draft card should be visually simplified.

Avoid:

- Too many nested cards
- Excessive badges
- Large warning blocks consuming the page
- Excessive borders
- Multiple competing controls
- Making the textarea look like a generic admin form

Instead, establish a clear hierarchy:

```text
✦ AI GENERATED DRAFT

Responding to:
nphadfinance.nph@nph.org.uk

────────────────────────────

We will send the signed PAYMENT CERT
for contract ref 88213 to your address.

Expect delivery by [INSERT DATE].

────────────────────────────

⚠ 1 unresolved placeholder
```

The unresolved placeholder must remain obvious because it is a safety feature.

However, the warning should feel integrated into the draft rather than like an unrelated alert card.

---

# 10. Draft Editing

The existing ability to edit the draft must remain available.

The redesign may present editing as:

- Inline editing
- Expandable editor
- Edit mode
- Clearly accessible secondary action

Do not remove existing editing functionality.

Do not change the backend/server action contract.

Do not change how drafts are stored.

Do not change how approval works.

Only improve the frontend presentation and interaction.

---

# 11. "Try Saying" Suggestions

The current five large beige pill buttons are too visually dominant.

Reduce the visual weight.

Use approximately 2–3 contextually useful suggestions.

Examples:

- Make it more formal
- Make it shorter
- Read the draft

They should feel like **suggestions**, not a row of primary buttons.

They should visually support the voice experience rather than compete with the orb.

---

# 12. Email Context

The email context should be compact.

Instead of a large card containing every piece of metadata, use a concise header such as:

```text
NPH AD FINANCE

Overdue Invoice — PAYMENT CERT required

Finance · Priority · Pending review
```

The sender and received timestamp may remain available where useful, but should not visually overpower the voice workspace.

The original message must remain accessible.

Do not remove the "View original message" capability.

It may be implemented as a compact expandable section.

---

# 13. Safety UX Must Remain

Foreman's existing safety model must not be weakened.

From the existing system specification:

- Voice sending is deliberately blocked.
- Saying "Send the email" must NOT automatically send.
- The user must explicitly use the on-screen approval/send action.
- Approved/sent drafts must become read-only according to the existing behavior.

The redesign must make this distinction understandable.

A good interaction is:

User says:

> "Send the email."

Foreman responds:

> **I can prepare it, but sending requires your confirmation on screen.**

The user then sees the explicit approval action.

Do not introduce any voice-triggered sending.

---

# 14. Placeholder UX

Foreman intentionally uses placeholders such as:

`[INSERT DATE]`

or:

`[CONFIRM SITE ACCESS DATE]`

These are important safety mechanisms.

The redesigned UI should make unresolved placeholders visually obvious without turning the entire draft into an alarming warning panel.

Preferred approach:

```text
Expect delivery by [INSERT DATE].
             ↑
        highlighted
```

with a compact message:

**1 unresolved item needs your attention**

The user should immediately know what needs confirmation.

---

# 15. Responsive / Mobile-First Requirements

The Voice Page is specifically designed for field staff using mobile devices.

The implementation must prioritize:

- 375px–430px mobile widths
- One-handed interaction where practical
- Large enough voice interaction target
- Comfortable vertical spacing
- No horizontal overflow
- No clipped cards
- No awkward nested scrolling
- No tiny text
- Clear bottom actions

Test at minimum:

- 375 × 812
- 390 × 844
- 412 × 915

Also verify desktop/wider layouts without allowing the mobile composition to become a tiny centered card surrounded by excessive empty space.

---

# 16. Visual Language

The redesign should feel like a mature B2B AI product.

Desired characteristics:

- Calm
- Premium
- Minimal
- Spacious
- Professional
- High readability
- Restrained use of color
- Strong typography hierarchy
- Consistent radius system
- Consistent spacing
- Subtle elevation
- Purposeful animation

Avoid:

- UI-kit/demo appearance
- Excessive pill badges
- Excessive card nesting
- Excessive shadows
- Random colors
- Decorative gradients everywhere
- Giant controls without purpose
- Inconsistent border radii
- Excessive uppercase labels

---

# 17. Important: Do Not Redesign the Whole Dashboard

The current request is specifically about the **Voice Page**.

Do NOT use this work as an excuse to redesign:

- Main dashboard
- Inbox
- Email detail page
- Audit log
- Authentication
- Backend
- n8n
- Supabase
- Twilio
- WhatsApp
- Voice APIs

Existing non-voice dashboard UI is outside this redesign scope.

---

# 18. Frontend-Only Hard Boundary

This redesign is strictly frontend-only.

Do NOT modify:

- Supabase schema
- Supabase migrations
- Supabase RLS
- Supabase triggers
- Supabase functions
- Supabase storage
- Supabase auth configuration
- Supabase data
- n8n workflows
- n8n credentials
- n8n webhooks
- Twilio
- WhatsApp
- Meta templates
- Email providers
- SMTP / IMAP configuration
- Backend API contracts
- Server-side voice processing
- Server Actions
- Edge Functions
- Workers
- Cron jobs
- Queues
- Infrastructure
- Deployment configuration
- CI/CD
- Secrets
- Environment configuration

Existing frontend calls may continue to use the current APIs and server actions exactly as they do now.

Do not change their contracts.

If a desired visual improvement appears to require a backend/integration modification, stop and report it rather than making the change.

---

# 19. Git / Branch Rules

All work must remain on:

```text
Tanish-frontend
```

Before making changes:

```bash
git branch --show-current
git status --short
```

If the branch does not exist, report the issue.

If the working tree contains unrelated uncommitted changes:

- Do not discard them.
- Do not reset.
- Do not stash automatically.
- Report the condition and ask for direction.

Never work directly on `main`.

Never merge this work into `main`.

Never rebase/cherry-pick `main` into the branch.

Do not create a PR targeting `main`.

---

# 20. Implementation Strategy

Do not rewrite the entire voice page blindly.

First inspect the existing Voice Page and identify:

- Current component structure
- Existing voice state handling
- Existing STT/TTS calls
- Existing rewrite calls
- Existing draft state
- Existing approval action
- Existing token/auth handling
- Existing responsive behavior
- Existing reusable UI components

Then redesign only the frontend presentation.

Preserve working behavior.

Prefer refactoring components where necessary rather than creating duplicated parallel implementations.

---

# 21. Required Voice States

The UI must visibly support the existing functional states where applicable:

```text
READY / IDLE
LISTENING
PROCESSING / TRANSCRIBING
THINKING
SPEAKING
ERROR
DISCONNECTED
APPROVED / READ-ONLY
SENT / READ-ONLY
```

Do not invent backend behavior for states that do not currently exist.

Map the existing implementation states to the visual system.

---

# 22. Draft + Voice Relationship

This relationship is the most important design requirement.

Example:

### Initial

```text
VOICE

        ◉
      Ready

"Hold to speak"


AI GENERATED DRAFT

We will send the signed PAYMENT CERT
for contract ref 88213...

Expect delivery by [INSERT DATE].
```

### User says:

> "Make it more formal."

### UI:

```text
        ◉
     Thinking...


        ↓


        ◉
     Speaking


AI GENERATED DRAFT

Dear NPH Finance Team,

We will provide the signed PAYMENT
CERT for contract reference 88213...

Expected delivery is [INSERT DATE].
```

The user should be able to visually understand:

**I spoke → Foreman processed it → Foreman changed my draft.**

That is the core experience.

---

# 23. Do Not Over-Design the Conversation

Foreman is not intended to become a full chat application.

Do not create a huge ChatGPT-style transcript unless the existing product actually needs it.

A lightweight conversational history may be used where helpful:

```text
You
"Make it more formal."

Foreman
"Done. I've updated the draft."
```

But the **draft remains the primary artifact**.

The Voice Page should not become a generic chat interface.

---

# 24. Interaction Details

Use subtle transitions for:

- Orb state changes
- Draft updates
- Suggestions appearing/disappearing
- Placeholder changes
- Expand/collapse of original message
- Edit mode
- Approval state

Animations should generally be short and purposeful.

Avoid:

- Long page transitions
- Excessive bounce
- Large scaling animations
- Constant distracting movement

Respect reduced-motion preferences if the existing frontend architecture supports it.

---

# 25. Acceptance Criteria

The redesign is complete only when all of the following are true.

### Visual

- [ ] Voice interaction is clearly the visual hero.
- [ ] The page no longer looks like a stack of unrelated cards.
- [ ] The giant conventional microphone-button treatment is replaced by a premium voice-state experience.
- [ ] ChatGPT Voice is clearly reflected in the simplicity and hierarchy.
- [ ] ElevenLabs is clearly reflected in the professional voice-agent composition.
- [ ] The result still feels like Foreman rather than a copy of either reference.
- [ ] Spacing and typography feel deliberate.
- [ ] UI elements have consistent visual language.
- [ ] Excessive pills/cards have been reduced.

### Functional

- [ ] Existing voice interaction still works.
- [ ] Existing STT flow still works.
- [ ] Existing TTS flow still works.
- [ ] Existing rewrite actions still work.
- [ ] Existing draft editing still works.
- [ ] Existing placeholder handling remains intact.
- [ ] Existing approval/send flow remains intact.
- [ ] Voice cannot directly send an email.
- [ ] Approved/sent read-only behavior remains intact.
- [ ] Existing token authentication remains intact.

### Draft visibility

- [ ] AI-generated draft is visible on the Voice Page.
- [ ] Draft remains accessible while voice interaction is happening.
- [ ] Draft updates are clearly visible after successful voice edits.
- [ ] Unresolved placeholders are obvious.
- [ ] The draft does not require navigating to another page just to review it.

### Responsive

- [ ] 375 × 812 verified.
- [ ] 390 × 844 verified.
- [ ] 412 × 915 verified.
- [ ] No horizontal overflow.
- [ ] No clipped primary controls.
- [ ] No awkward nested scrolling.
- [ ] Desktop/wider viewport verified.

### Scope

- [ ] Only frontend files were changed.
- [ ] No backend/integration files were modified.
- [ ] No Supabase/n8n/Twilio/WhatsApp changes.
- [ ] No API contracts changed.
- [ ] No secrets/environment configuration changed.

---

# 26. Verification

Run the appropriate existing frontend checks, at minimum where available:

```bash
npm run lint
npm run build
```

Also perform manual visual verification of the Voice Page at the required mobile sizes.

Verify the following interaction sequence:

```text
Open voice review link
        ↓
See email context
        ↓
See AI draft
        ↓
Voice becomes ready
        ↓
Hold to speak
        ↓
Listening
        ↓
Speak an instruction
        ↓
Processing / thinking
        ↓
Draft updates
        ↓
Foreman speaks / confirms
        ↓
User reviews draft
        ↓
User explicitly approves/sends on screen
```

Also verify:

```text
"Send the email"
```

spoken through voice does NOT automatically send the email.

---

# 27. Git Commit

After the redesign has been implemented and verified:

- Confirm branch is `Tanish-frontend`.
- Review `git diff`.
- Review changed file paths.
- Confirm no backend/integration files were touched.
- Commit the completed Voice Page redesign with a clear commit message.

Suggested:

```text
feat(frontend): redesign voice review experience
```

Do not merge into `main`.

Do not push unless separately authorized.

---

# 28. Completion Gate — Important

This document represents the **required redesign/completion work for the currently built Phase 7 Voice Page**.

The coding agent must NOT immediately jump into unrelated Phase 8 work.

The sequence is:

```text
CURRENT STATE
Phase 7 Voice Page exists
        ↓
IMPLEMENT THIS DOCUMENT
Voice Page Reference 1 + Reference 2 redesign
        ↓
VERIFY
Frontend-only + visual + functional regression checks
        ↓
COMPLETE PHASE 7 VOICE PAGE REDESIGN
        ↓
STOP
        ↓
MOVE TO PHASE 8 OF
FRONTEND-ONLY PHASED IMPLEMENTATION PLAN
```

Once this Voice Page redesign is fully completed and verified, **Phase 8 of the existing Frontend-Only Phased Implementation Plan becomes the next authorized implementation stage**.

Phase 8 must still follow the original implementation plan's rules:

- Frontend-only
- `Tanish-frontend` branch
- No `main`
- No backend changes
- No Supabase changes
- No n8n changes
- No Twilio/WhatsApp changes
- No opportunistic work outside the approved phase
- Verify, report, and respect the phase stop gate

Do not silently skip from this document into additional unrelated redesign work.

---

# 29. Final Product Direction

The finished Voice Page should communicate one clear idea:

> **Foreman is a professional AI email copilot that lets a field employee review and refine an email naturally by voice while keeping the actual email draft visible and under human control.**

The experience should feel:

**Voice-first.  
Professional.  
Calm.  
Fast.  
Human-in-the-loop.  
Email-aware.  
Premium.**

The user should open the page and immediately understand:

> **"Foreman is listening, I can talk to it, and I can see exactly what it is preparing for me."**

That is the target.

---

## AUTHORITY

When this document conflicts with older visual/UI instructions specifically concerning the Voice Page, **this document takes precedence for the Voice Page redesign**.

The existing Frontend-Only Phased Implementation Plan remains authoritative for:

- branch rules
- frontend-only boundaries
- phase discipline
- testing
- reporting
- stop gates
- Phase 8 scope after this work is completed

**Execute this Voice Page redesign first. Verify it. Complete it. Then proceed to Phase 8 according to the existing implementation plan.**
