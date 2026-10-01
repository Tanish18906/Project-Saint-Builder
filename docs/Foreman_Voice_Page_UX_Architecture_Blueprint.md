# FOREMAN VOICE PAGE REDESIGN — UX ARCHITECTURE & COMPONENT BLUEPRINT

**Author:** Subagent C (UX Architect)  
**Date:** October 2026  
**Project:** Foreman — AI Email Agent (Project Saint Builder)  
**Status:** Authoritative Architectural Blueprint & Implementation Specification  
**Branch:** `Tanish-frontend` (Strict Frontend-Only Boundary)  
**Target Viewports:** Mobile-First: 375×812, 390×844, 412×915 (with responsive desktop scale)  
**Design References:** ChatGPT Voice (AVM) + ElevenLabs Voice Agents + Foreman Document Artifact  

---

## 1. Executive Summary & Paradigm Shift

The existing Phase 7 Voice Page is functionally capable (STT, TTS, rewrite APIs, realtime updates, and HMAC authentication all function), but suffers from **card fatigue, pill pollution, visual fragmentation, and inverted hierarchy**. 

### The Core Problem:
On standard mobile devices (375px–390px width), the previous layout stacked 5 separate bordered cards:
```
[Header Card (135px)] + [Collapsible Card (56px)] + [Voice Controls (250px)] + [Action Toolbar (150px)] = 591px!
```
On an 844px screen (with ~760px usable viewport after browser chrome), the **AI Draft was completely pushed below the fold**, with less than 120px of visible space remaining. The field manager had to scroll endlessly and could not see the email draft while speaking commands to edit it.

### The Paradigm Shift:
We transition Foreman from a **"Bento Box Administrative Form"** into a **"Unified Single-Canvas Voice-First Workspace"**:
1. **The Voice Orb is the Hero**: Replaces the 140px industrial black intercom button with an organic, breathing multi-state AI orb inspired by ChatGPT Voice and ElevenLabs.
2. **The AI Draft is the Primary Work Artifact**: Positioned directly beneath the orb and above the docked action bar, visible concurrently with voice interactions on mobile glass.
3. **Calm, High-Contrast Ergonomics**: Elimination of 15+ competing borders and 18+ noisy pills. Replaced with soft tonal grouping, inline placeholder tokens, and thumb-friendly 44px–52px touch targets.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. COMPACT CONTEXT ANCHOR (Header & Collapsible)   ~80px    │
├─────────────────────────────────────────────────────────────┤
│ 2. VOICE HERO STAGE (Orb + Status + Suggestions)   ~196px   │
├─────────────────────────────────────────────────────────────┤
│ 3. LIVE AI DRAFT ARTIFACT (Document Surface)       ~240px   │
│    BOTH ORB & DRAFT SIMULTANEOUSLY VISIBLE ABOVE THE FOLD!  │
├─────────────────────────────────────────────────────────────┤
│ 4. DOCKED SAFETY ACTION BAR (Sticky Footer)        ~140px   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Viewport Vertical Height Budget & Layout Calculus

To guarantee that **BOTH the Voice Orb AND the AI Draft are immediately visible without scrolling** on mobile screens, we establish a strict pixel budget based on actual CSS rendering metrics.

### A. iPhone 12/13/14/15/16: 390px × 844px
- **Total Physical Height:** 844px
- **Mobile Safari / Chrome Chrome:** ~74px (Notch/Dynamic Island + URL bar + home bar)
- **Net Usable Canvas Height:** **~770px**

| Component Tier | Vertical Height | Layout Details | Cumulative Height |
| :--- | :--- | :--- | :--- |
| **Top Container Padding** | 12px | `pt-3` top spacing | 12px |
| **Tier 1: Compact Context Anchor** | **80px** | Nav row (22px) + Subject H1 (24px) + Collapsible trigger (22px) + padding (12px) | 92px |
| **Inter-tier Spacing** | 12px | `gap-3` / `space-y-3` | 104px |
| **Tier 2: Voice Hero Stage** | **196px** | Voice Orb core & aura (120px) + State & subtext (38px) + Suggestions (30px) + margin (8px) | 300px |
| **Inter-tier Spacing** | 12px | `gap-3` / `space-y-3` | 312px |
| **Tier 3: AI Draft Artifact** | **238px** | Header bar (28px) + 5 lines draft text (120px) + Placeholder helper (28px) + padding (20px) + border | 550px |
| **Bottom Content Buffer** | 80px | Extra scroll cushion for toolbar overlap | 630px |
| **Tier 4: Docked Action Bar** | **140px** | Primary button (52px) + Secondary row (44px) + Safety note (16px) + Padding & safe area (28px) | **770px (100% Fit)** |

**Result:** On 390px × 844px, **100% of the Voice Orb AND 100% of the AI Draft Artifact are simultaneously visible above the sticky toolbar on initial load**. No scrolling is required to review or dictate.

---

### B. iPhone SE / Mini: 375px × 812px
- **Total Physical Height:** 812px
- **Mobile Safari / Chrome Chrome:** ~72px
- **Net Usable Canvas Height:** **~740px**

| Component Tier | Vertical Height | Compact Adaptations | Cumulative Height |
| :--- | :--- | :--- | :--- |
| **Top Container Padding** | 8px | `pt-2` | 8px |
| **Tier 1: Compact Context Anchor** | **76px** | Nav row (20px) + Subject H1 (22px) + Collapsible trigger (20px) + padding (14px) | 84px |
| **Inter-tier Spacing** | 10px | `gap-2.5` | 94px |
| **Tier 2: Voice Hero Stage** | **184px** | Voice Orb core (112px) + State label & subtext (36px) + Suggestions (28px) + margin (8px) | 278px |
| **Inter-tier Spacing** | 10px | `gap-2.5` | 288px |
| **Tier 3: AI Draft Artifact** | **226px** | Header bar (26px) + Draft text (116px) + Placeholder helper (26px) + padding (18px) | 514px |
| **Bottom Content Buffer** | 90px | Safe cushion for floating bar | 604px |
| **Tier 4: Docked Action Bar** | **136px** | Primary button (52px) + Secondary row (42px) + Safety note (14px) + Padding (28px) | **740px (100% Fit)** |

**Result:** Even on smaller 375px devices, the user sees the complete Voice Orb and the full top half of the draft with all detected placeholders without scrolling.

---

## 3. Voice + Live Draft Interaction Dynamics

The core product promise is: **"I speak → Foreman processes it → Foreman visibly changes my draft."**

### Spoken Instruction Lifecycle & State Flow:

```text
[1. IDLE / READY]
  │  Orb: Calm breathing (#1C1A17 with soft cream glow)
  │  Status: "Ready" • "Hold to speak or tap"
  │  Draft: Displayed in document mode with amber placeholder pills
  ▼
[2. USER SPEAKS (Push-to-Talk or Tap-to-Talk)]
  │  Orb: Expands with responsive cyan/slate aura (#4D7480)
  │  Status: "Listening..." • "I'm listening..."
  │  Draft: Stays clear and readable; user references draft while talking
  ▼
[3. PROCESSING / THINKING]
  │  Orb: Orbital graphite gradient rotation (#5E6470)
  │  Status: "Thinking..." • "Refining your draft..."
  │  Draft Artifact Surface: Border transitions to active brand pulse 
  │                          (ring-1 ring-[var(--brand)]/30 border-[var(--brand)]/40)
  ▼
[4. DRAFT UPDATE & HIGHLIGHT]
  │  Server returns rewritten text
  │  Draft Artifact: Triggers @keyframes draft-update-highlight (1.2s soft emerald/brand shimmer)
  │  Placeholders: Regex re-evaluates in real time; resolved tokens disappear from helper
  ▼
[5. AUDIBLE CONFIRMATION (TTS PLAYBACK)]
  │  Orb: Fluid acoustic amber wave dilation (#D97706)
  │  Status: "Speaking" • "Playing updated version..."
  │  Foreman speaks: "Updated draft in formal style: [Text]"
  │  Stop Control: Compact "Stop" pill appears; or tapping the orb immediately interrupts (barge-in)
  ▼
[6. RETURN TO READY]
  │  Orb: Settles back into calm breathing state
  │  Status: "Ready" • "Hold to speak or tap"
```

### Key Technical Interaction Rules:
1. **Non-Blocking Interaction:** During TTS playback or thinking, the user is **never locked out** of the interface. They can:
   - Tap the draft's `[Edit ✎]` button to manually tweak text.
   - Tap any suggestion chip (`"make it shorter"`).
   - Press or tap the Orb to interrupt TTS and start a new voice command.
   - Tap "Approve & Send" or "Save Draft".
2. **Visual Shimmer Feedback:** When the draft updates, `draft-update-highlight` flashes a soft `#1E3A2F1F` background highlight that gently dissipates over 1200ms, providing instant visual feedback that the spoken command took effect.
3. **Audible Confirmation Graceful Fallback:** If audio playback is blocked by mobile autoplay policies, a non-intrusive banner or resume trigger is provided, but text updates are never delayed.

---

## 4. 4-Tier Information Architecture & Component Hierarchy

### Tier 1: Compact Context Anchor (`VoiceHeader.tsx` + `OriginalEmailCollapsible.tsx`)
- **Max Height:** 80px–90px when collapsed.
- **Visual Style:** Borderless, clean canvas integration (no separate high-contrast white card border).
- **Structure:**
  1. **Top Navigation & Security Micro-Bar:**
     - `← Inbox` text link (44px touch target) for easy return navigation.
     - Right: Subtle, calm security lock indicator: `🔒 Signed 24h` (neutral stone/emerald micro-pill).
     - Inline Category & Urgency badges (`Finance` • `Priority`).
  2. **Primary Subject H1:**
     - 15px font-bold, charcoal `#17191C`, truncated with ellipsis if exceeding 1–2 lines.
  3. **Inline Accordion Trigger (Merged Original Email):**
     - Single row: `From: NPH AD Finance <nph@org.uk> • [▾ View original message]` (44px touch target).
     - Clicking smoothly slides open the original inbound message directly in place, with full body text and a quick `Copy` button.
     - Collapsing returns height to < 85px.

---

### Tier 2: Voice Hero Stage (`VoiceOrb.tsx` + Status + Suggestions)
- **Max Height:** 180px–200px.
- **Central Visual Hero (`VoiceOrb.tsx`):**
  - **112px Core Sphere:** Deep charcoal/slate radial gradient (`radial-gradient(circle at 35% 35%, #2a2723, #1c1a17)`).
  - **136px Resonance Ring:** Dynamic semantic border with reactive ripple.
  - **160px Ambient Aura:** Blurred radial light layer (`blur-xl`) with smooth opacity transitions.
  - **Semantic States:**
    - `idle`: Slow breathing animation (`scale: 0.98 ↔ 1.02`, 3.5s period).
    - `listening`: Responsive cyan/teal acoustic pulse (`#4D7480`), expanding capture halo.
    - `thinking`: Dual graphite gradient orbital spin (`#5E6470`), restrained and purposeful.
    - `speaking`: Warm amber audio wave dilation (`#D97706`), rhythmic pulsation.
- **Status Typography (36px):**
  - **State Title:** 14px bold (`Ready`, `Listening...`, `Thinking...`, `Speaking`).
  - **Context Subtext:** 12px text-[var(--text-secondary)] (`"Hold to speak or tap"`, `"I'm listening..."`, `"Tell me what to change"`).
- **Suggestion Chips (32px):**
  - Exactly 2–3 contextual pills:
    - `"make it formal"`
    - `"make it shorter"`
    - `"read draft"`
  - Styling: Low-contrast stone pill (`bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs px-3 py-1 rounded-full border border-stone-200/60`).
  - Tapping immediately dispatches the voice action.

---

### Tier 3: AI Draft Artifact (`VoiceDraftArtifact.tsx`)
- **Max Height:** 220px–240px initial view, with internal scroll if content exceeds.
- **Surface Styling:** Executive document memo surface (`bg-white rounded-2xl border border-[var(--border-subtle)] shadow-xs`).
- **Header Row:**
  - Left: `✦ AI Generated Draft` (subtle brand badge, 11px font-semibold).
  - Right: `24 words • 180 chars` + `[✎ Edit]` toggle button (36px min-h, 44px min-w touch area).
- **Recipient Subtext:** `To: nphadfinance.nph@nph.org.uk` (12px, clean text).
- **Draft Body (Read Mode):**
  - Clean typographic layout (15px font, 1.6 line height, charcoal `#17191C`).
  - Unresolved placeholders (`[INSERT DATE]`, `[CONFIRM REF]`) rendered as **inline highlighted pill tokens** directly within sentences.
- **Draft Body (Edit Mode):**
  - Transitions smoothly into an auto-sizing, focused textarea (`focus:ring-2 focus:ring-[var(--brand)]`), allowing rapid manual typing.
- **Placeholder Helper Bar (Docked at foot of artifact):**
  - If 1+ placeholders detected:
    `⚠ 1 item needs confirmation: [INSERT DATE]` (subtext: *"Dictate or tap Edit"*).
- **Reset Action:** If edited, a discreet `[↺ Reset to AI]` button appears in the header.

---

### Tier 4: Docked Safety Action Bar (`VoiceActionToolbar.tsx`)
- **Max Height:** 136px–140px.
- **Position:** Fixed at bottom of glass (`fixed bottom-0 left-0 right-0 z-30`).
- **Surface:** `bg-white/95 backdrop-blur-md border-t border-[var(--border-subtle)] shadow-lg`.
- **Primary Action (52px Touch Target):**
  - Full-width button: `w-full h-[52px] min-h-[52px] bg-[#1c1a17] text-[#f5f1e8] rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md`.
  - Icon: `ShieldCheck` in emerald `#34D399`.
  - Label: **"APPROVE & SEND REPLY"**.
- **Secondary Action Row (44px Touch Targets):**
  - 2-column grid:
    - **Save Draft:** 44px, white background, stone border, `Save` icon.
    - **Discard:** 44px, white background, red border and text, `Trash2` icon.
- **Safety Micro-Caption:**
  - `🔒 Voice sending disabled for safety — tap confirmation required.` (11px, centered).
- **Safe Area Padding:** Respects `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.

---

## 5. Unresolved Placeholder UX Specification

Unresolved placeholders are critical safety gates for field operations (e.g. `[INSERT DATE]`, `[CONFIRM SITE ACCESS]`).

### 1. Regex Identification
```ts
export const PLACEHOLDER_REGEX = /\[(?:CONFIRM|INSERT|TODO|VERIFY|DATE|TIME|NAME|AMOUNT|PHONE|ADDRESS|\.\.\.)[^\]]*\]|\[\s*\.\.\.[^\]]*\]|\[[A-Z0-9_\s\-:]{3,}\]/gi
```

### 2. Inline Rendering within Draft Text
In `VoiceDraftArtifact.tsx`, the raw draft string is tokenized into text fragments and placeholder matches:

```tsx
export function renderDraftWithPlaceholders(text: string, onPlaceholderClick?: (ph: string) => void) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const matches = Array.from(text.matchAll(PLACEHOLDER_REGEX))

  matches.forEach((match, i) => {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }
    const token = match[0]
    parts.push(
      <span
        key={`ph-${i}-${token}`}
        onClick={() => onPlaceholderClick?.(token)}
        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-300 font-mono text-xs font-semibold select-all cursor-pointer hover:bg-amber-500/20 transition-colors"
        title="Unresolved placeholder — click to edit or speak to resolve"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
        {token}
      </span>
    )
    lastIndex = matchIndex + token.length
  })

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
```

### 3. Integrated Bottom Helper (Non-Alarmist)
Rather than a giant 80px red/amber warning box, we render a calm 1-line helper attached directly to the base of the draft card:
```tsx
{placeholders.length > 0 && (
  <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50/70 border-t border-amber-200/70 text-xs text-amber-900 rounded-b-2xl">
    <div className="flex items-center gap-1.5 font-medium truncate">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>
        {placeholders.length} item{placeholders.length > 1 ? 's' : ''} need confirmation
      </span>
    </div>
    <span className="text-[11px] text-amber-800/80 italic shrink-0">
      Say &quot;The date is Friday&quot; or tap Edit
    </span>
  </div>
)}
```

### 4. Modal Safety Verification & Defect 2 Fix
In `VoiceConfirmationModals.tsx`, when the user confirms "Approve & Send", the warning in the modal must use **exactly ONE icon** (fixing the duplicate icon bug where both an SVG icon and `⚠️` emoji were rendered):
```tsx
{/* FIXED: Single AlertTriangle icon, no emoji duplicate */}
{hasPlaceholders && (
  <div
    role="alert"
    className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 flex items-start gap-2.5"
  >
    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
    <div className="text-xs font-semibold leading-relaxed">
      Placeholder Warning: This draft contains unverified placeholders. Please ensure all details are confirmed before dispatching.
    </div>
  </div>
)}
```

---

## 6. Mobile Ergonomics & Touch Targets

Field workers frequently operate mobile devices one-handed, outdoors, or with work gloves.

### 1. The Voice Orb Interaction Model (Hybrid Push-to-Talk + Tap-to-Talk)
- **Push-to-Talk (Default):** Press and hold anywhere in the 140px active area to speak. Release to process.
- **Tap-to-Talk (Field Convenience):** A quick tap (< 250ms) toggles recording on; a second tap stops recording. This is essential when holding equipment or gloves prevent continuous touch pressure.
- **Preventing Mobile Context Menu:**
  ```tsx
  onContextMenu={(e) => e.preventDefault()}
  className="touch-none select-none ..."
  ```
- **Pointer & Touch Listeners:** Handlers support both standard pointer events (`onPointerDown`, `onPointerUp`) and mobile touch events (`onTouchStart`, `onTouchEnd`) with debounce protection.

### 2. Strict Touch Target Audit Table

| Control Element | Target Dimensions | Implementation Class | Standard Compliance |
| :--- | :--- | :--- | :--- |
| **Voice Orb Hero** | 112px core / 140px zone | `w-28 h-28` with `p-4` aura | Exceeds iOS 44pt / Android 48dp |
| **Approve & Send Button** | 52px height × 100% width | `h-[52px] min-h-[52px]` | Exceeds 48px standard |
| **Save Draft Button** | 44px height × 50% width | `h-[44px] min-h-[44px]` | Meets 44px standard |
| **Discard Button** | 44px height × 50% width | `h-[44px] min-h-[44px]` | Meets 44px standard |
| **Back / Inbox Nav Link** | 44px min touch target | `min-h-[44px] min-w-[44px]` | Meets 44px standard |
| **Original Email Accordion** | 44px height × 100% width | `min-h-[44px]` | Meets 44px standard |
| **Draft Edit / Done Toggle** | 36px height × 48px touch zone | `min-h-[36px] px-3` | Meets 44px touch area |
| **Try Saying Suggestion Chips** | 36px height × auto width | `min-h-[36px] px-3.5` | Meets 36–44px chip standard |
| **Modal Close Button** | 44px × 44px | `min-h-[44px] min-w-[44px]` | Meets 44px standard |

---

## 7. Component File Structure & Types Blueprint

### 1. `src/components/voice/types.ts`
Preserve all existing data models (`VoiceEmailItem`, `VoiceDraftItem`, `VoiceEmailAccount`, `VoiceUIState`, `VoiceFeedback`, `VoiceEmailViewProps`, `VoiceActionToolbarProps`). Add new component interfaces:

```ts
export type VoiceUIState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface VoiceFeedback {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export interface VoiceOrbProps {
  uiState: VoiceUIState
  showMicBusy: boolean
  isLocked: boolean
  onPointerDown: () => void
  onPointerUp: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  onClick?: () => void
  onStopAudio: () => void
  micPermissionDenied: boolean
  onSwitchToTextMode: () => void
  lastTranscript?: string
  onSelectSuggestedCommand?: (cmd: string) => void
}

export interface VoiceDraftArtifactProps {
  draftText: string
  onChangeDraftText: (text: string) => void
  initialAIText: string | null
  isLocked: boolean
  isPending: boolean
  onRewriteTone: (tone: 'formal' | 'shorter' | 'technical') => void
  onResetToInitialAI: () => void
  draftStatus?: string
  approvedAt?: string | null
  approverName?: string | null
  recipientEmail: string
  isDraftUpdated?: boolean
}

export interface VoiceHeaderProps {
  email: VoiceEmailItem
  draft: VoiceDraftItem | null
  isLocked: boolean
}
```

---

### 2. `src/components/voice/VoiceOrb.tsx` (NEW COMPONENT)
Dedicated multi-layered organic voice orb component:
- **Props:** `VoiceOrbProps`.
- **Layers:**
  1. Outer blurred aura (`160px × 160px blur-xl`): Color and opacity bound to `uiState`.
  2. Resonance ring (`136px × 136px`): Animates pulse waves during `listening` and `speaking`.
  3. Core sphere (`112px × 112px`): Radial gradient with subtle inner shadow.
  4. Center state glyph:
     - `idle`: Crisp microphone in warm cream `#F5F1E8`.
     - `listening`: 5-bar dynamic equalizer in slate-teal `#4D7480`.
     - `processing`: Dual orbital gradient ring with `orb-thinking-spin`.
     - `speaking`: Rhythmic audio waves in amber `#F59E0B`.
- **Status Typography:** Bold 14px state title (`Ready`, `Listening...`, etc.) + 12px subtext.
- **Suggestion Chips:** 2–3 contextual chips below status.
- **Transcript Bubble:** Floating bubble showing `"You said: ..."` when `lastTranscript` is available.

---

### 3. `src/components/voice/VoiceHeader.tsx` (STREAMLINED COMPACT)
Consolidates the previous header card and the original email collapsible into a unified compact context anchor:
- **Props:** `VoiceHeaderProps`.
- **Structure:**
  - Micro-bar: `← Inbox` link + Category badge (`Finance`) + Urgency dot (`• Priority`) + `🔒 Signed 24h`.
  - Subject line: 15px font-bold, single-line or 2-line truncated.
  - Collapsible trigger: `From: [Sender] • [▾ View original message]`.
  - Smooth expandable container: When expanded, reveals original inbound email text + copy button without leaving page.
  - Zero card borders when collapsed; seamless canvas integration.

---

### 4. `src/components/voice/VoiceDraftArtifact.tsx` (REPLACES `VoiceDraftReviewCard.tsx`)
Replaces the administrative form card with an executive document artifact:
- **Props:** `VoiceDraftArtifactProps`.
- **Features:**
  - Document canvas styling with subtle border and shadow.
  - Provenance tag (`AI-Generated Draft` / `Voice-Rewritten` / `Staff-Edited`) + word counter.
  - Dual Mode:
    - **Read Mode (Default):** Rendered as typography prose with inline amber placeholder pills.
    - **Edit Mode:** Seamlessly toggles to textarea on tap of `[Edit ✎]` button.
  - Reset button: Discreet `[↺ Reset to AI]` when modified.
  - Integrated 1-line placeholder confirmation helper at bottom.

---

### 5. `src/components/voice/VoiceAudioControls.tsx` (COORDINATOR)
Streamlined coordinator that delegates visual rendering to `VoiceOrb.tsx`:
- Manages audio autoplay resume banner if blocked by browser policies.
- Handles mic permission denied error display and "Switch to text mode" trigger.
- Passes push-to-talk, tap-to-talk, stop audio, and suggested command handlers to `VoiceOrb`.

---

### 6. `src/components/voice/VoiceActionToolbar.tsx` (SLIM STICKY FOOTER)
- 52px "Approve & Send Reply" primary button with emerald shield icon.
- 44px "Save Draft" and "Discard" secondary buttons.
- Centered 11px safety note: `🔒 Voice sending disabled for safety — tap confirmation required.`
- High-contrast charcoal/cream buttons.

---

### 7. `src/components/voice/VoiceConfirmationModals.tsx` (FIXED MODALS)
- **Defect 2 Fix:** Eliminates duplicate `⚠️` character next to `<AlertTriangle />` in placeholder alert.
- Strips out 3 layers of nested card borders; replaces with clean background grouping.
- Mobile bottom sheet with drag handle bar, 52px confirm button, and 44px close button.

---

### 8. `src/components/voice/VoiceEmailView.tsx` (PARENT COORDINATOR)
Maintains 100% of existing functionality:
- Supabase realtime draft subscription.
- TTS audio playback with sequential tracking and fallback.
- STT audio recording with MediaRecorder and WebM blob dispatch.
- Tone rewrites (`formal`, `shorter`, `technical`, `apply_edit`).
- Manual save, discard, and approval server actions.
- Assembles Tier 1 (`VoiceHeader`), Tier 2 (`VoiceAudioControls`/`VoiceOrb`), Tier 3 (`VoiceDraftArtifact`), Tier 4 (`VoiceActionToolbar`), and Confirmation Modals into a single unified canvas.

---

### 9. `src/app/globals.css` (KEYFRAMES & STYLES)
Add dedicated keyframe animations to support the Voice Orb and Draft live updates:

```css
/* Calm Breathing for Idle Voice Orb */
@keyframes orb-breathe {
  0%, 100% {
    transform: scale(0.98);
    box-shadow: 0 0 20px 2px rgba(28, 26, 23, 0.08);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 32px 8px rgba(30, 58, 47, 0.16);
  }
}

/* Responsive Pulse for Listening Voice Orb */
@keyframes orb-listening-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(77, 116, 128, 0.5), 0 0 24px 4px rgba(77, 116, 128, 0.3);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 16px rgba(77, 116, 128, 0), 0 0 36px 10px rgba(77, 116, 128, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(77, 116, 128, 0), 0 0 24px 4px rgba(77, 116, 128, 0.3);
  }
}

/* Restrained Orbital Rotation for Thinking */
@keyframes orb-thinking-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Fluid Acoustic Dilation for Speaking */
@keyframes orb-speaking-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px 4px rgba(217, 119, 6, 0.25);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 36px 12px rgba(217, 119, 6, 0.45);
  }
}

/* Subtle Shimmer for AI Draft live updates */
@keyframes draft-update-highlight {
  0% { background-color: rgba(30, 58, 47, 0.12); }
  100% { background-color: transparent; }
}
```

---

## 8. Step-by-Step Implementation Handoff Checklist

To be followed sequentially by the implementation engineer:

1. **Step 1: CSS Animation Setup (`globals.css`)**
   - Append `orb-breathe`, `orb-listening-pulse`, `orb-thinking-spin`, `orb-speaking-pulse`, and `draft-update-highlight` keyframes.
2. **Step 2: Update Types (`src/components/voice/types.ts`)**
   - Add `VoiceOrbProps`, `VoiceDraftArtifactProps`, and updated `VoiceHeaderProps`.
3. **Step 3: Create `VoiceOrb.tsx` (`src/components/voice/VoiceOrb.tsx`)**
   - Implement 4-state visual orb, gesture handlers (push-to-talk & tap-to-talk), status text, and suggestion chips.
4. **Step 4: Refactor `VoiceHeader.tsx` (`src/components/voice/VoiceHeader.tsx`)**
   - Consolidate badges and integrate the expandable original email accordion directly into the compact context anchor.
5. **Step 5: Create `VoiceDraftArtifact.tsx` (`src/components/voice/VoiceDraftArtifact.tsx`)**
   - Implement executive memo surface, inline placeholder token rendering, edit toggle, reset button, and 1-line bottom confirmation helper.
6. **Step 6: Update `VoiceAudioControls.tsx` (`src/components/voice/VoiceAudioControls.tsx`)**
   - Embed `VoiceOrb.tsx` and manage audio banner / mic permission recovery.
7. **Step 7: Update `VoiceConfirmationModals.tsx` (`src/components/voice/VoiceConfirmationModals.tsx`)**
   - Fix double icon bug on line 149 and clean up nested card borders.
8. **Step 8: Wire `VoiceEmailView.tsx` (`src/components/voice/VoiceEmailView.tsx`)**
   - Integrate all streamlined components into the unified single-canvas layout.
9. **Step 9: Update Re-exports (`src/components/voice/index.ts`)**
   - Export new `VoiceOrb` and `VoiceDraftArtifact`, maintaining backward compatibility aliases.
10. **Step 10: Verification (`npm run lint` & `npm run build`)**
    - Verify zero TypeScript or lint errors, and test mobile viewport rendering.
