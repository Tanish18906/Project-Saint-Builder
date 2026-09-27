> **Design authority notice (2026-09-27):** The companion UI spec and phased plan were archived to `Docs/archive/superseded-design/voice/`. Visual guidance and the "do not touch the voice page" restrictions in this document are **superseded** by [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). The interaction **state list (§2), edge states (§4–§5) and safety constraints (§8: no voice send, no weakening of recording/playback/token logic) remain in force.**

# Voice Page — UX Redesign Spec

**For: coding agent**
**Context:** Companion to `voice-page-ui-redesign-spec.md`. That doc covers visual styling; this doc covers **interaction design, information architecture, and state/flow logic** — what happens and when, and what information the user needs at each moment, not how it's colored or shaped. Same hard constraint as the UI spec: do not modify the underlying functional implementation (audio capture, TTS, STT, command parsing, HMAC auth, the send-requires-manual-tap safety rule). This is about redesigning the *experience* around already-working functionality, not the functionality itself.

Where this spec calls for a new visual state or component, it should specify *what it needs to communicate and when it appears* — the UI spec (or a shared implementation pass) owns exactly how it looks.

---

## 1. Core UX problem with the current page

The current layout presents the mic button, the status bar, and the command list as three independent, unconnected components. A first-time user (this page is reached via a WhatsApp link, so there's no onboarding, no prior context, no chance to "learn the app" — every visit is effectively a first visit under time pressure) has to piece together the flow themselves: is it currently listening to me? Did my command register? What happens if I say nothing? None of this is currently communicated by anything other than static text.

The redesign goal: make the page's current state legible **within one glance**, without reading the instructional text, because a real user in a real situation (site manager, one-handed, possibly outdoors, possibly time-pressured) won't read a paragraph before acting.

---

## 2. Interaction states — define the full state machine

Work with whatever the current implementation actually does (do not change the underlying logic), but make sure every state below is **visually and informationally distinct** on the page, not just internally tracked in code:

1. **Page load / TTS auto-playing the email** — user has just opened the link, audio of the email is playing automatically (subject to autoplay policy — see Section 4)
2. **TTS finished, awaiting input** — the email has been read aloud, page is now waiting for the user to hold the mic button
3. **Listening** (mic held, capturing audio)
4. **Processing** (mic released, command being parsed/executed — e.g. "make it more formal" is being sent to the rewrite endpoint)
5. **Command executed, draft updated** — the AI has made a change (e.g. draft is now more formal); does the user get the updated draft read back to them automatically, or do they need to say "read the draft" again? **This is a real UX decision to make explicitly, not leave implicit** — recommend: after any edit command, automatically play a brief confirmation ("Updated — here's the new version") followed by reading the new draft, rather than silently updating text the user can't see (remember: this is a voice-first flow, a silent text update is invisible to someone using this hands-free)
6. **Ready to send** — draft is finalized, user needs to physically tap Approve & Send (per the existing safety rule)
7. **Sent confirmation** — after tapping send, the user needs clear confirmation the email actually went, not just a page that quietly changes state

**Currently, states 2, 4, and 5 have no distinct treatment at all** — this is the biggest functional-feeling gap in the experience, even though it's a UX/design gap, not a bug. Prioritize these three.

---

## 3. Fill the dead space with a genuine activity indicator, not decoration

The empty gap between the context card and the status bar (flagged in the UI spec) should be filled with a **speaking/listening activity indicator** — something that visually represents "audio is happening right now" (e.g. a waveform, an animated equalizer-style bar set, or a simple pulsing indicator) that's present during TTS playback AND during active listening, with a distinct visual treatment for each (the UI spec should differentiate "the app is talking" from "the app is listening to you" using this same component, not two unrelated ones).

This is not decorative — it's the single component that would do the most to make states 1, 3, and 4 (playing, listening, processing) legible at a glance, which is the core problem this spec is solving.

---

## 4. Autoplay-blocked state — currently invisible, needs to be a first-class state

Per the prior bug-fix session, there's already a "tap-to-play unlock" handler for browsers that block autoplay. Right now this likely surfaces as a generic browser-style prompt or an easy-to-miss inline message. Given this page's entire premise is hands-free/voice-first, a user landing on a page that's silently blocked from playing audio — with no clear call-to-action — is a real dead-end.

Design this as an explicit, unmissable state: a clear "Tap to start listening to your email" prompt that visually matches the rest of the page's design language (not a generic browser permission bar), appearing in place of the normal auto-playing state when autoplay is blocked.

---

## 5. Error and edge states — currently undesigned

None of these appear to have dedicated treatment currently. Each needs a state that fits into the same visual/informational language as the rest of the page (not a raw error message):

- **Expired token** (24h HMAC expiry) — user opens a stale WhatsApp link. Needs a clear "This link has expired" state with guidance (e.g. "Ask [sender] to resend, or check the dashboard") rather than a broken page or silent failure
- **Microphone permission denied** — needs a clear explanation and a way to recover (link to browser settings guidance, or a fallback to "Show Text Instead")
- **No speech detected** after holding the mic button and releasing without saying anything — needs graceful handling (a brief "Didn't catch that — try again" state), not silence or a stuck "processing" indicator
- **Command not understood** — if the user says something the parser doesn't recognize as one of the supported commands, they need feedback, not a silent no-op

---

## 6. "Show Text Instead" — define what this actually reveals and why

Confirm/define the purpose: is this an accessibility fallback (for a user who can't or doesn't want to use voice at all), a verification tool (so a user can double-check the draft text after voice-editing it before sending), or both? The answer changes what content it should show and how prominent it should be.

Recommendation: treat it primarily as a **verification/confidence tool** — after voice-editing a draft, a user may reasonably want to see the actual text before committing to "Approve & Send," even if they got here via voice. Given that, "Show Text Instead" arguably shouldn't be styled as a buried fallback option (per the UI spec's note that it currently has too much visual weight) but also shouldn't be hidden — it should be easy to reach right before the send action specifically, since that's the moment a user is most likely to want it. Flag this recommendation for confirmation rather than assuming it's correct — this is a product decision, not a pure UX default.

---

## 7. Voice command list — presented as guidance, not as a fixed feature list

Currently all 5 commands are shown permanently, at full prominence, at all times. Consider whether this should adapt to context — e.g. "discard" is only a meaningful thing to say once a draft exists to discard; showing all 5 commands identically regardless of what state the page is in may create confusion about what's actually actionable right now. This is a genuine UX question, not a required change — flag it as a recommendation, and if implementing it adds real complexity to the state logic, default to keeping the static list (simpler, lower risk) rather than over-engineering a context-aware command list for a first pass.

---

## 8. What NOT to do in this spec

- Do not change the underlying audio capture, TTS, STT, or command-parsing implementation
- Do not remove or weaken the manual-tap-required safety rule for sending — any UX change here must preserve that a voice command alone can never trigger a send
- Do not add new voice commands or change what the 5 existing commands do
- Do not over-engineer the command-list context-awareness (Section 7) if it adds meaningful complexity — flag and defer rather than force it into this pass

## 9. Output expected

- Confirmation of the full state list (Section 2) and which states currently have zero distinct treatment vs. partial vs. complete
- A decision or recommendation on the "Show Text Instead" purpose question (Section 6) — implement the recommendation but flag it as a product decision worth the client's confirmation
- Confirmation that the manual-tap-to-send safety rule was preserved unchanged
- List of any new states/components this introduces that the UI spec will need to style, so the two specs stay in sync
