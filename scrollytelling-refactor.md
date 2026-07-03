---
name: scrollytelling-refactor
trigger: "@scrollytelling-refactor"
description: >
  Refactors static UI components into performant scrollytelling / kinetic
  motion layouts. Enforces GSAP ScrollTrigger + Lenis best practices so
  Gemini never falls back to raw `scroll` event listeners, unthrottled
  `getBoundingClientRect()` polling, or un-cleaned-up animation timelines.
context:
  framework: "Next.js (App Router)"
  styling: "Tailwind CSS"
  language: "TypeScript"
  animation: "GSAP + ScrollTrigger"
  scroll: "Lenis (lenis/react)"
---

# Skill: Scrollytelling & Kinetic Motion Refactoring

## Purpose

This skill governs how static components are converted into
scroll-driven, pinned, or kinetically animated layouts. It exists to stop
the most common failure mode in AI-generated scroll code: **manual
`window.addEventListener('scroll', ...)` handlers that read layout on
every frame and cause jank**. GSAP ScrollTrigger + Lenis replace that
entire category of code. Treat the rules below as hard constraints, not
suggestions — do not silently fall back to native scroll listeners even
if they seem "simpler" for a given case.

---

## 0. Non-Negotiable Ban List

Before writing any code, confirm none of the following appear in the
diff. If they do, the refactor is incorrect and must be redone:

- ❌ `window.addEventListener('scroll', ...)` or `onScroll` props used to
  drive animation state
- ❌ `element.getBoundingClientRect()` called inside a scroll handler
  without `requestAnimationFrame` throttling
- ❌ `useState` + `setState` called on every scroll tick (causes
  re-render storms)
- ❌ Inline `style={{ transform: ... }}` recalculated in React render
  instead of via GSAP's own DOM writes
- ❌ CSS `scroll-behavior: smooth` combined with Lenis (they fight each
  other — Lenis fully owns smoothing once installed)
- ❌ ScrollTrigger instances created without a matching `revert()` /
  `kill()` on unmount
- ❌ Hard-coded pixel start/end markers (`start: 400`) instead of
  semantic markers (`start: 'top center'`)

If an existing component already violates these, the refactor task
includes removing the violation, not just adding GSAP alongside it.

---

## 1. Smooth Scroll Foundation (Lenis)

**Rule:** Every page that contains ScrollTrigger-driven animation must
sit inside a Lenis root. Before adding any scroll animation, check
whether a global Lenis wrapper already exists (typically in
`app/layout.tsx` or a `providers.tsx`). If it does not exist, create
one — do not instantiate a second, page-local Lenis instance.

**Implementation contract:**

```tsx
// app/providers/smooth-scroll-provider.tsx
'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenis = useLenis(({ scroll }) => {
    // Sync ScrollTrigger with Lenis on every Lenis tick.
    ScrollTrigger.update();
  });

  useEffect(() => {
    // Drive GSAP's ticker with Lenis instead of native RAF,
    // and disable GSAP's own lag smoothing so the two don't compete.
    function update(time: number) {
      lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => gsap.ticker.remove(update);
  }, [lenis]);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
```

**Checklist before moving on:**
- [ ] Confirmed a single global Lenis instance (searched for existing
      `ReactLenis` / `lenis/react` usage before adding a new one)
- [ ] `gsap.ticker` is synced to Lenis's `raf`, not left on native RAF
- [ ] `gsap.ticker.lagSmoothing(0)` is set to prevent Lenis/GSAP timing
      conflicts
- [ ] No `scroll-behavior: smooth` left in global CSS

---

## 2. Viewport Pinning Mechanics

**Rule:** Any "lock the screen while an animation plays" pattern must
use ScrollTrigger's native `pin`, never a `position: sticky` + manual
opacity hack.

**Implementation contract:**

```tsx
ScrollTrigger.create({
  trigger: sectionRef.current,
  start: 'top top',
  end: '+=200%',       // relative end — see Rule 4
  pin: true,
  anticipatePin: 1,    // prevents jitter on 120Hz/144Hz displays
  scrub: 1,             // ties progress to scroll position, not a fixed duration
  invalidateOnRefresh: true, // recalculates on resize instead of caching stale values
});
```

**Structural requirements on the pinned element:**
- Must have an explicit height: `h-screen` or `min-h-screen` (a pinned
  element with implicit/auto height will collapse and break the pin
  spacer GSAP inserts).
- Must set `overflow: hidden` on the pinned container's parent if child
  content can exceed viewport bounds, to prevent scrollbar flicker.
- Avoid `overflow: hidden` directly on `<body>` or `<html>` — this
  breaks Lenis's virtual scroll calculations.

**Checklist:**
- [ ] `pin: true` used instead of `position: sticky` for hold-in-place
      sequences
- [ ] `anticipatePin: 1` set
- [ ] `invalidateOnRefresh: true` set for any pin whose start/end depend
      on element size
- [ ] Pinned element has explicit `h-screen` / `min-h-screen`
- [ ] No `overflow: hidden` on `<body>`/`<html>`

---

## 3. Performance & Cleanup (React Lifecycle Safety)

**Rule:** Every GSAP timeline or ScrollTrigger created inside a
component must be scoped inside `gsap.context()` (or `useGSAP()` from
`@gsap/react`, which wraps context automatically) and reverted on
unmount. This is mandatory — unscoped ScrollTrigger instances survive
Next.js fast refresh and App Router client-side navigation, silently
stacking duplicate triggers and leaking memory.

**Implementation contract (preferred — `useGSAP` hook):**

```tsx
'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function KineticSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top center',
          end: 'bottom top',
          scrub: true,
        },
      });

      tl.from('.kinetic-word', { opacity: 0, y: 40, stagger: 0.1 });

      // No manual cleanup needed — useGSAP reverts automatically on unmount.
    },
    { scope: container } // scopes selectors + auto-revert to this ref
  );

  return <div ref={container}>{/* ... */}</div>;
}
```

**Implementation contract (manual `gsap.context()` fallback, if
`@gsap/react` is not installed):**

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top center',
        scrub: true,
      },
    }).from('.kinetic-word', { opacity: 0, y: 40, stagger: 0.1 });
  }, container);

  return () => ctx.revert(); // MANDATORY — kills timelines + ScrollTriggers
}, []);
```

**Checklist:**
- [ ] Every timeline is created inside `useGSAP()` or `gsap.context()`
- [ ] Cleanup (`ctx.revert()` or `useGSAP` auto-revert) is present —
      never omitted "for simplicity"
- [ ] Selectors inside the context use the `scope` ref rather than
      global `document.querySelector` (prevents cross-component
      selector collisions)
- [ ] No orphaned `ScrollTrigger.create()` calls outside a context/hook

---

## 4. Mobile & Responsive Degradation

**Rule:** Pinning and aggressive scroll-jacking are frequently hostile
to touch scrolling and small viewports. Never ship a pin/scrub
interaction to mobile without an explicit, deliberate decision.

**Implementation contract:**

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 768px)',
      isMobile: '(max-width: 767px)',
    },
    (context) => {
      const { isDesktop } = context.conditions as { isDesktop: boolean };

      if (isDesktop) {
        // Full pinned scrollytelling sequence.
        ScrollTrigger.create({
          trigger: container.current,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: '+=150%',
        });
      } else {
        // Mobile fallback: simple reveal-on-scroll, no pin, no scrub.
        gsap.from('.kinetic-word', {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          scrollTrigger: {
            trigger: container.current,
            start: 'top 80%',
          },
        });
      }
    }
  );

  return () => mm.revert();
}, { scope: container });
```

**Rules within this section:**
- Never use hard pixel values (`start: 400`, `end: 1200`) for
  start/end markers — always semantic strings (`'top center'`,
  `'bottom top'`, `'top 80%'`) or relative offsets (`'+=200%'`), since
  pixel values break the instant content height or viewport changes.
- Breakpoint for disabling/simplifying pin behavior is `768px`, matching
  Tailwind's `md:` breakpoint, unless the component's existing
  responsive design already defines a different breakpoint — in that
  case, match the existing one instead of introducing a second system.
- If pin is disabled on mobile, the underlying content must still be
  fully readable in normal document flow (no `opacity: 0` states left
  unresolved because their trigger never fires).

**Checklist:**
- [ ] No hard pixel start/end values anywhere in the diff
- [ ] `gsap.matchMedia()` wraps any pin/scrub logic
- [ ] Mobile branch explicitly defined (not just "disabled" with no
      fallback — content must still animate or at minimum render
      correctly)
- [ ] `mm.revert()` returned for cleanup, mirroring Rule 3

---

## 5. Refactor Workflow

When invoked via `@scrollytelling-refactor` on an existing component,
follow this order:

1. **Audit** — scan the target component and its layout ancestors for
   violations from the Section 0 ban list and note whether a Lenis
   provider already wraps the tree.
2. **Foundation** — add/confirm the Lenis provider (Section 1) before
   touching component-level animation.
3. **Convert** — rewrite the interaction using `useGSAP` +
   `ScrollTrigger`, applying pinning rules (Section 2) only where the
   original intent was a "locked" sequence; use plain `scrub`/`from`
   reveals for simpler parallax or fade-in effects.
4. **Scope & Clean** — verify every new timeline is inside a scoped
   hook with revert (Section 3).
5. **Degrade** — wrap in `matchMedia` for mobile (Section 4).
6. **Verify** — re-run the Section 0 ban list against the final diff.
   Report any rule that could not be satisfied and why, rather than
   silently shipping a violation.

---

## 6. Required Dependencies

Confirm these are present before generating code that imports them; if
missing, surface the install command rather than assuming:

```bash
npm install gsap @gsap/react lenis
```
