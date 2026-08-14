# Responsive UI (Phase 09)

## Breakpoints

Tailwind defaults: `sm` mobile, `md` tablet, `lg` desktop, `xl` large desktop.

## Commerce surfaces

| Surface | Mobile | Desktop |
|---|---|---|
| Shop filters | Drawer / stacked | Sidebar |
| Product grid | 1–2 cols | 3–4 cols |
| PDP | Stacked media/info | Two-column |
| Cart | Full-width lines | Table-like rows |
| RINPO panel | Collapsed bottom-right | Expanded panel, max-height capped |

## a11y

- Focus rings on `@rinads/ui` Button/Input
- `aria-label` on icon buttons
- Skip link in app layouts
- Reduced motion: respect `prefers-reduced-motion` in RINPO animations
