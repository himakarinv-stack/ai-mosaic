# Accessibility

## Require
- Semantic HTML (button, a, nav, main, heading hierarchy)
- Visible focus indicators; logical tab order
- Labels for every form control (label[for] or aria-label)
- Live regions for async status updates where needed
- Color contrast meets WCAG AA for text and interactive states

## Flag (BLOCKER/HIGH)
- div/span with (click) and no keyboard/ARIA contract
- icon-only buttons without aria-label
- Missing alt text on meaningful images
- Focus traps without escape path
- role="button" on non-interactive elements without tabindex
