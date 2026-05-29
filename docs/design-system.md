# Design System

Last updated: 2026-05-29

This app keeps the design system intentionally small. Prefer reusing the
tokens and components below instead of adding near-duplicate colors, font
sizes, or one-off text styles.

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
- Do not add raw `fontSize` numbers in screens.
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

Mapping guidance:

- `#52525B`, `#5B5E67`, `#374151`, `#1F2937` collapse into `grayIcon`,
  `slate`, or `black` based on contrast need.
- `#34D399` and `#2DD4BF` collapse into `mint`.
- `#DC2626` collapses into `red`.
- `#E5E7EB` collapses into `lineStrong`.
- `#F4F4F5` collapses into `sheet`.
- Avoid adding new hex values unless the color represents a genuinely new
  semantic role.

## Components

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
