# Voice Page — UI Redesign Spec

**For: coding agent**
**Context:** The voice review page (`app/voice/[email_id]/page.tsx`) is functionally stable — TTS playback, dictation, voice commands, and HMAC-signed auth all work correctly and were verified in a prior bug-fix session. This spec covers **visual design only**. Do not touch any functional logic: audio playback, speech recognition, command parsing, token validation, the Approve & Send business logic, or the safety rule requiring a manual button tap to send. If a visual change requires touching a file that also contains functional logic, change only the styling-relevant lines — do not refactor or "improve" logic you encounter along the way.

This page already uses the Foreman charcoal/cream design tokens from the dashboard redesign (`--foreman-charcoal`, `--foreman-cream`, etc. — see `Dashboard-UI_Design-spec.md` for the full token set, unchanged, reuse it directly, do not invent new tokens for this page unless explicitly noted below). The problem is not missing brand color — it's that every component currently has the same flat visual weight, so nothing communicates hierarchy or state. This spec fixes that.

---

## 1. Reference: current state (what this replaces)

The current page, top to bottom:
- A white card containing 3 small badges (theme/urgency/status) + a role badge, and below that the email subject + sender — all inside one undifferentiated card
- A large empty gap
- A status message bar ("Playing your email...") in a slightly different shade of white, same border-radius/shadow as everything else
- A plain black circle mic button with a mic icon and "HOLD TO SPEAK" text, no visual states
- 5 voice command "chips" in monospace font inside bordered boxes, all identical weight, reading like disabled form inputs rather than example phrases
- A black "Approve & Send Reply" button with a lock-icon caption below it
- A white "Show Text Instead" bar pinned near the bottom

Every element above uses the same white background, the same border-radius, and roughly the same shadow — there is no visual signal for what matters most on this screen.

---

## 2. Visual hierarchy — establish 3 distinct card weights

Introduce a deliberate weight system so the eye knows where to go without reading text first:

- **Tier 1 — Context card** (theme/urgency/status badges + subject + sender): should read as reference information, present but recessive. Reduce visual weight relative to what it has now — lighter border instead of a full card shadow, or a subtle background tint (`--foreman-cream-dim`) instead of pure white, so it sits *behind* the interaction area conceptually, not competing with it.
- **Tier 2 — Status/activity area** (the "Playing your email..." bar and whatever replaces the dead space beneath it — see UX spec for the waveform/activity-indicator treatment): should read as live, present-tense information. This is the one area on the page that should feel like it's actively happening right now — give it the most "alive" visual treatment (see Section 3 on the speaking-indicator).
- **Tier 3 — The mic button**: the clear visual anchor of the entire page. Everything else should visually defer to it. See Section 4 for full state design — this section just establishes that no other element on the page should compete with it in size, contrast, or shadow depth.

The voice command chips and the Approve & Send button are functional controls, not content — style them as controls (Section 5), not as a fourth content tier.

---

## 3. Badge and chip styling — stop looking like disabled form elements

**Theme/urgency/status/role badges** (top card): these currently look identical to each other regardless of meaning. Apply the same two-tier urgency logic already established in the dashboard redesign (red/amber for urgent/priority, neutral otherwise) — this page should visually agree with the dashboard's badge language, not invent a new one. The role badge (e.g. "Director") should be visually distinct from the theme/urgency/status badges — it's a different kind of information (who, not what) and currently reads as just a 4th identical pill.

**Voice command chips**: currently styled like disabled `<input>` fields (monospace text, flat bordered box). Redesign these to read as **example spoken phrases**, not form controls:
- Move away from monospace — these are things a person says out loud, not code
- Consider a more conversational visual treatment (quotation-mark styling that feels intentional rather than literal `"..."` characters embedded in the text, softer background fill rather than a hard border)
- These are not tappable in this page's current interaction model (voice-only input, per the UX spec's constraints) — style them clearly as *reference/example* content, not as buttons, so users don't try to tap them expecting an action

---

## 4. Mic button — full state system (the centerpiece of this redesign)

This is the most important single component on the page and currently has zero state design — it looks the same whether idle, listening, or processing. Design distinct visual states:

- **Idle**: current black circle treatment is a reasonable baseline — keep the charcoal fill, but consider a subtle ambient treatment (soft outer glow or pulse at rest) so it doesn't read as inert/disabled while waiting for input
- **Listening/active** (while held and recording): needs a visually distinct treatment from idle — options to consider: an expanding ring/pulse synced to the fact that audio is being captured, a color shift (careful with charcoal-brand consistency — a shift in the ring/glow color around the button rather than the button's own fill color is safer than introducing a new brand color), a scale change on press
- **Processing** (after release, while the command is being parsed/executed): needs a visually distinct treatment from both idle and listening — a real user needs to know "I'm not holding it anymore, but it's working on what I said" — this is currently the least visible interaction in the entire flow and users have no way of knowing if their input registered while waiting
- **Disabled/unavailable** (if this state exists — e.g. while TTS is mid-playback and the app enforces a wait-your-turn interaction, confirm with the UX spec whether this state is needed): should look clearly non-interactive, not just a dimmed version of idle

Coordinate with the UX spec for exactly which states the interaction model requires — this section defines how each state should *look*, not which states exist or when they trigger (that's UX territory).

---

## 5. Buttons — Approve & Send, and Show Text Instead

- **Approve & Send Reply**: already uses correct charcoal/white treatment per the dashboard's primary-button convention — keep this, but confirm the lock-icon safety caption beneath it has enough visual separation from the button itself that it doesn't look like it's part of the button (currently ambiguous whether the safety text is a caption or a sub-label)
- **Show Text Instead**: currently styled identically to a content card (white, bordered, shadow) rather than as a secondary/tertiary action. Restyle as a clearly secondary control — lower visual weight than Approve & Send, positioned so it reads as "the fallback option," not equal in prominence to the primary voice flow

---

## 6. Spacing and dead space

The current large gap between the context card and the status bar reads as unfinished, not intentional. This spec does not resolve *what* fills that space (that's the UX spec's job — likely a speaking/waveform indicator) — but whatever does fill it needs to visually belong to Tier 2 (Section 2), continuing the "live activity" visual language rather than being dropped in as an isolated decorative element.

---

## 7. What NOT to do in this spec

- Do not touch audio playback, speech recognition, command parsing, or token validation logic
- Do not change the manual-tap-required safety rule for sending — visual treatment only, not the interaction requirement itself
- Do not introduce new brand colors outside the existing charcoal/cream token set without a clear functional reason (e.g. a listening-state accent color) — and if one is introduced, keep it desaturated/muted, consistent with the existing "restrained color use" principle from the dashboard redesign
- Do not redesign the email content itself if "Show Text Instead" is expanded — that view's styling should follow the same card-tier system as the dashboard's email detail view, not be reinvented here

## 8. Output expected

- Screenshots or rendered output of all mic button states (idle/listening/processing at minimum)
- Confirmation no functional files were modified beyond necessary style-only lines
- List of any new CSS variables introduced (should be minimal — reusing dashboard tokens is the default)
- Flag any ambiguity between "is this a UI concern or UX concern" encountered while implementing, rather than silently deciding — note it in the report
