---
name: design-system
description: Design tokens, component patterns, and accessibility rules. Auto-activates for any frontend/UI work. CUSTOMIZE this for your project's brand and design language.
---

# Design system

## Brand colors
<!-- CUSTOMIZE: Replace all placeholder values with your project's actual design tokens -->
- Primary:          #REPLACE (main action color — buttons, links, highlights)
- Primary dark:     #REPLACE (hover/pressed state of primary)
- Accent:           #REPLACE (secondary emphasis, decorative elements)
- Background:       #REPLACE (page/app background)
- Surface:          #REPLACE (card, modal, panel background)
- Text primary:     #REPLACE (headings and body copy)
- Text secondary:   #REPLACE (captions, placeholders, helper text)
- Error:            #REPLACE (destructive actions, validation errors)
- Success:          #REPLACE (confirmation, positive states)
- Warning:          #REPLACE (caution states, non-blocking alerts)

> If your project uses CSS custom properties or a token library (Tailwind, Radix, etc.),
> reference those names here instead of raw hex values.

## Typography
<!-- CUSTOMIZE: Replace with your project's typeface decisions -->
- Heading font:   [project font or system stack]
- Body font:      [project font or system stack]
- Code font:      monospace system stack
- Base size:      16px, line-height 1.6
- Minimum size:   14px (prefer 16px for body copy)

## Accessibility (WCAG AA minimum — non-negotiable)
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Touch targets: minimum 44×44px on mobile (48×48px preferred)
- All images need descriptive alt text (empty alt="" for decorative images)
- All interactive elements need visible focus indicators (not just color change)
- Form inputs need associated `<label>` elements — no placeholder-as-label
- Error messages identify the field and describe the fix, not just "invalid"
- Full keyboard navigation — no mouse-only interactions
- ARIA labels on icon-only buttons and controls

## Component patterns
- Cards: rounded corners (8–12px radius), subtle border or drop shadow — not both
- Buttons: primary (filled), secondary (outlined), ghost (text only), destructive (red tint)
- Forms: label above input, inline validation on blur, all errors shown at once (not one-by-one)
- Navigation: bottom tabs for mobile (max 4 items), sidebar or top nav for desktop
- Loading: skeleton screens preferred over spinners for content areas
- Empty states: illustration or icon + short message + single clear action
- Modals: always closable via Escape key and backdrop click; trap focus inside

## Responsive breakpoints
- Mobile:  < 640px  — single column, stacked layout
- Tablet:  640–1024px — flexible grid, condensed nav
- Desktop: > 1024px — max-width container, full sidebar/nav

## Spacing scale
<!-- CUSTOMIZE: Replace with your project's spacing tokens -->
Use a consistent scale (e.g., 4px base: 4, 8, 12, 16, 24, 32, 48, 64).
Avoid arbitrary spacing values — pick the nearest scale step.
