# Design System

Last updated: 2026-05-29

This app keeps the design system intentionally small. Prefer reusing the
tokens and components below instead of adding near-duplicate colors, font
sizes, or one-off text styles.

The visual baseline is the post detail screen: white mobile canvas, image-led
content where relevant, left-aligned headers, thin separators, spacious text
rows, and a fixed bottom action bar for primary actions.

## Typography

Font weight is controlled by `fontFamily`, not `fontWeight`.

Use only these regular UI sizes:

| Token | Size | Line height | Use |
|---|---:|---:|---|
| `xs` | 12 | 16 | Captions, metadata, badges |
| `sm` | 14 | 20 | Secondary body text, labels |
| `base` | 16 | 22 | Main body text, form values |
| `lg` | 18 | 26 | Section headings, prominent labels |
| `title` | 24 | 32 | Page titles and main modal titles |

Large route numbers, map labels, and other display numerals are not general UI
text. Keep those sizes inside the owning component so they do not expand the
global typography scale.

Rules:

- Do not use `fontWeight`.
- Do not reference platform or system fonts such as `System`, `Helvetica`,
  `Menlo`, or `monospace`.
- Do not add raw `fontSize` numbers in screens.
- Do not render visible text before Expo has loaded the bundled Noto Sans
  fonts.
- Page titles use `ScreenTitle`, which maps to bold `title`.
- Section headings use `AppText` with a section/title variant instead of custom
  font objects.

## Color

Merge similar colors into existing semantic tokens instead of creating small
shade differences.

| Use | Token |
|---|---|
| Page background | `colors.bg` |
| Cards, sheets, controls | `colors.surface` |
| Primary text | `colors.black` |
| Secondary text and dark icons | `colors.grayIcon` |
| Muted text | `colors.mutedText` |
| Light borders | `colors.line` |
| Strong borders / separators | `colors.lineStrong` |
| Primary brand fill | `colors.mint` |
| Primary brand text / emphasis | `colors.mintDark` |
| Soft brand background | `colors.mintLight` |
| Danger actions | `colors.red` |
| Modal backdrop | `colors.overlay` or `colors.overlayStrong` |
| White overlay on dark surfaces | `colors.overlayInverse` |
| Translucent white map labels | `colors.surfaceTranslucent` |

Mapping guidance:

- `#52525B`, `#5B5E67`, `#374151`, `#1F2937` collapse into `grayIcon`,
  `slate`, or `black` based on contrast need.
- `#34D399` and `#2DD4BF` collapse into `mint`.
- `#DC2626` collapses into `red`.
- `#E5E7EB` collapses into `lineStrong`.
- `#F4F4F5` should generally collapse into `surface`; use `sheet` only as an
  alias for the same white canvas.
- Avoid adding new hex values unless the color represents a genuinely new
  semantic role.

## Components

## Layout Language

- Use a white canvas (`colors.surface`) as the default screen background.
- Prefer full-width sections separated by `colors.lineStrong` over floating
  cards.
- When a card is necessary for repeated list items, keep the radius small and
  let typography/spacing carry hierarchy.
- Top bars are 88px-class mobile headers: back control on the left, title next
  to it, actions on the right.
- Primary CTAs live in a fixed bottom bar when they complete the current screen.
- Detail pages use the order: header, image/media, profile row, divider, title,
  metadata rows, divider, body, fixed action bar.

### `AppText`

Use `AppText` for shared text roles:

- `caption`
- `body`
- `bodyStrong`
- `label`
- `sectionTitle`
- `pageTitle`

`AppText` owns the font family, size, line height, and default color for each
variant. Screens can override layout properties and text color when needed, but
should not redefine font size or family unless they are a display numeral.

### `ScreenTitle`

Use `ScreenTitle` for page-level titles. It is a small wrapper around
`AppText variant="pageTitle"` and keeps screen headings aligned across routes.

### Existing controls

Existing shared controls such as `AppButton`, `TextInputField`, `FilterChip`,
and `Header` should use the same typography tokens internally. Do not create
button-specific or chip-specific font sizes unless the component introduces a
new real state that cannot use the shared variants.

## Forbidden Patterns

Do not add:

- `fontWeight` in screens or components
- raw hex or `rgba(...)` colors in screens or components
- new typography size tokens for one-off text
- page title styles declared separately per screen

When a visual needs an exception, document why in the owning component and keep
the exception local.
