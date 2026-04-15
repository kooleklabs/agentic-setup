---
name: design-system
description: Design tokens, component patterns, and accessibility rules. Auto-activates for any frontend/UI work. CUSTOMIZE this for your project's brand and design language.
---

# Design system

## Brand colors
<!-- [CUSTOMIZE] Replace with your project colors -->
- Primary: #0F6E56 (teal — trust)
- Accent: #BA7517 (gold — warmth)
- Background: #FFFFFF
- Surface: #F8F9FA
- Text primary: #2C2C2A
- Text secondary: #5F5E5A
- Error: #E24B4A
- Success: #639922

## Typography
<!-- [CUSTOMIZE] Replace with your fonts -->
- Headings: System font stack or project-specific
- Body: 16px base, line-height 1.6
- Code: monospace stack
- Minimum body size: 14px (16px preferred)

## Accessibility (WCAG AA minimum)
- Color contrast ratio: 4.5:1 for text, 3:1 for large text
- Touch targets: minimum 44x44px (48x48px preferred)
- All images need alt text
- All interactive elements need visible focus indicators
- Form inputs need associated labels
- Error messages identify the field and describe the fix
- Support keyboard navigation throughout
- ARIA labels on icon-only buttons

## Component patterns
- Cards: rounded corners (8-12px), subtle border or shadow
- Buttons: primary (filled), secondary (outlined), ghost (text only)
- Forms: labels above inputs, inline validation, error states
- Navigation: bottom tabs for mobile (4 max), sidebar for desktop
- Loading: skeleton screens preferred over spinners
- Empty states: illustration + message + action

## Responsive breakpoints
- Mobile: < 640px (single column)
- Tablet: 640-1024px (flexible grid)
- Desktop: > 1024px (max-width container)
