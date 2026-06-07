# fcards-web — Design System

Design reference for Fotbalové Kartičky. Covers colors, typography, component patterns, layout, animations, and Konva canvas conventions. Update this when adding new reusable UI patterns.

---

## Color System

**Dark Gold / Premium palette** — hue 75 (amber gold). Never use hue 285 (violet from flive-web).

All colors use `oklch()` values. **Do not use opacity modifiers** (`bg-primary/50`) — they break with CSS variable-based tokens. Use `color-mix()` instead:

```css
/* ✅ correct */
background: color-mix(in oklch, var(--primary) 15%, transparent);

/* ❌ breaks */
@apply bg-primary/50;
```

### Light mode tokens (`:root`)

```css
--background:           oklch(0.98 0.005 75);   /* near-white, warm tint */
--foreground:           oklch(0.12 0.015 75);   /* near-black */
--card:                 oklch(1 0 0);
--card-foreground:      oklch(0.12 0.015 75);
--popover:              oklch(1 0 0);
--popover-foreground:   oklch(0.12 0.015 75);
--primary:              oklch(0.72 0.16 75);    /* rich amber gold */
--primary-foreground:   oklch(0.10 0.01 75);
--secondary:            oklch(0.93 0.020 75);
--secondary-foreground: oklch(0.25 0.06 75);
--muted:                oklch(0.92 0.008 75);
--muted-foreground:     oklch(0.50 0.020 75);
--accent:               oklch(0.90 0.018 55);
--accent-foreground:    oklch(0.20 0.05 55);
--brand-accent:         oklch(0.65 0.14 55);    /* burnt orange */
--destructive:          oklch(0.577 0.245 27);
--border:               oklch(0.88 0.010 75);
--input:                oklch(0.88 0.010 75);
--ring:                 oklch(0.72 0.16 75);
--radius:               0.75rem;
--shadow-glow:          0 0 24px oklch(0.72 0.16 75 / 0.35);
--shadow-card-legendary: 0 0 32px oklch(0.72 0.16 75 / 0.50);
```

### Dark mode tokens (`.dark`)

```css
--background:           oklch(0.10 0.010 75);
--foreground:           oklch(0.95 0.005 75);
--card:                 oklch(0.15 0.015 75);
--primary:              oklch(0.78 0.17 75);    /* brighter gold in dark */
--muted:                oklch(0.22 0.015 75);
--muted-foreground:     oklch(0.60 0.015 75);
--border:               oklch(1 0 0 / 9%);
--input:                oklch(1 0 0 / 12%);
--shadow-glow:          0 0 28px oklch(0.78 0.17 75 / 0.40);
--shadow-card-legendary: 0 0 40px oklch(0.78 0.17 75 / 0.60);
```

### Sidebar tokens

```css
/* light */
--sidebar:              oklch(0.96 0.010 75);
/* dark */
--sidebar:              oklch(0.13 0.012 75);
/* shared */
--sidebar-primary:      (same as --primary)
--sidebar-border:       (same as --border)
```

### Rarity tokens

Seven rarity levels with dedicated CSS tokens. Each has a base color and a foreground (`-fg`) for text on that background.

| Rarity | CSS token | Light value | Dark value | Hex (canvas) |
|---|---|---|---|---|
| common | `--rarity-common` | `oklch(0.65 0.01 0)` | `oklch(0.68 0.01 0)` | `#888888` |
| uncommon | `--rarity-uncommon` | `oklch(0.60 0.15 145)` | `oklch(0.65 0.16 145)` | `#22c55e` |
| rare | `--rarity-rare` | `oklch(0.55 0.22 258)` | `oklch(0.62 0.23 258)` | `#4f8ef7` |
| epic | `--rarity-epic` | `oklch(0.55 0.22 300)` | `oklch(0.62 0.23 300)` | `#b06cf8` |
| legendary | `--rarity-legendary` | `oklch(0.72 0.16 75)` | `oklch(0.78 0.17 75)` | `#c9a227` |
| mythic | (animated) | holographic gradient | holographic gradient | `#c9a227` |
| limited | `--rarity-limited` | `oklch(0.55 0.25 15)` | `oklch(0.60 0.26 15)` | `#ef4444` |

Usage in components:

```tsx
// CSS components — use CSS variable
style={{ color: "var(--rarity-legendary)" }}
className="border-[var(--rarity-rare)]"

// Konva canvas — use hex constant (CSS vars don't resolve in canvas context)
import { RARITY_COLORS_CANVAS } from "@/lib/konvaEffects";
const color = RARITY_COLORS_CANVAS[card.rarity];
```

---

## Typography

Two Google Fonts loaded via `next/font/google` in the root layout:

| Font | CSS variable | Tailwind class | Use |
|---|---|---|---|
| **Inter** | `--font-sans` | `font-sans` (default body) | All UI text, body, forms, labels |
| **Oswald Bold** | `--font-display` | `font-display font-bold` | Card headings, player names, stat numbers |

```html
<!-- Player name on card or stats display -->
<p class="font-display font-bold text-2xl">Jan Novák</p>

<!-- Body / label text -->
<p class="font-sans text-sm text-muted-foreground">Zápasová · 2024/25</p>
```

---

## Gradient Utilities

Defined in `src/app/globals.css` `@layer utilities`. All have `.dark` variants.

| Class | What it does | Typical use |
|---|---|---|
| `.gradient-brand` | `135deg` gold → burnt orange | Primary CTAs, hero backgrounds |
| `.gradient-text` | Same gradient clipped to text | App name, accent headings |
| `.gradient-hero` | Subtle gold wash | Landing hero sections |
| `.gradient-card-legendary` | Radial gold overlay | Legendary card containers |
| `.gradient-mythic` | Animated holographic (blue→purple→gold→green, 4s) | Mythic cards only |
| `.glass` | `backdrop-blur(16px)` + semi-transparent bg + border | Floating headers, overlays |
| `.shadow-glow` | `var(--shadow-glow)` | Highlighted elements, active states |
| `.shadow-card-legendary` | `var(--shadow-card-legendary)` | Legendary card display |

Gradient text:
```html
<span class="gradient-text font-display font-bold text-2xl">Fotbalové Kartičky</span>
```

---

## Animation Utilities

Keyframes defined in `globals.css @theme inline`:

| Class | Effect | Duration | Use |
|---|---|---|---|
| `.animate-card-reveal` | `rotateY(90°→0°) + scale(0.8→1)` | 0.5s spring | New card generation reveal |
| `.animate-shimmer` | Background-position sweep | 2s loop | Loading skeletons, shimmer overlays |
| `.gradient-mythic` | `holographic` keyframe on background-position | 4s loop | Mythic card display (class includes animation) |

---

## Buttons

Use `<Button>` from `src/components/ui/button` (shadcn).

```tsx
<Button>Primary</Button>                          // gold fill
<Button variant="outline">Secondary</Button>     // bordered
<Button variant="ghost">Tertiary</Button>         // text-only
<Button variant="destructive">Delete</Button>     // red
<Button size="sm">Small</Button>
<Button size="icon" className="h-9 w-9" aria-label="Smazat">
  <Trash2 className="h-4 w-4" />
</Button>
```

Gradient CTA pattern:
```tsx
<Button className="gradient-brand text-primary-foreground border-none hover:opacity-90">
  Vytvořit kartičku
</Button>
```

Disabled + loading:
```tsx
<Button disabled={isSaving}>
  {isSaving ? "Ukládám..." : "Uložit"}
</Button>
```

---

## Input Fields

Always use `<Label>` + `<Input>` pairs. Field errors inline below — never in a toast.

```tsx
<div className="space-y-1.5">
  <Label htmlFor="name">Jméno hráče</Label>
  <Input id="name" placeholder="Jan Novák" {...register("name")} />
  {errors.name && (
    <p className="text-xs text-destructive">{errors.name.message}</p>
  )}
</div>
```

Always define a zod schema first, derive type from it:
```ts
const schema = z.object({ name: z.string().min(2, "Povinné pole") });
type FormValues = z.infer<typeof schema>;
```

---

## Cards (UI containers)

shadcn `<Card>` for content panels and data display blocks:

```tsx
<Card>
  <CardHeader>
    <h3 className="font-display font-bold text-lg">Title</h3>
  </CardHeader>
  <CardContent className="space-y-3">...</CardContent>
</Card>
```

Clickable card:
```tsx
<Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={...}>
```

---

## Badges

**shadcn Badge** — general status/label:
```tsx
<Badge>Status</Badge>
<Badge variant="outline">Label</Badge>
```

**RarityBadge** — rarity-colored pill, card rarity only:
```tsx
import { RarityBadge } from "@/components/card/RarityBadge";

<RarityBadge rarity="legendary" />
<RarityBadge rarity="epic" className="text-[10px] px-1.5 py-0" />
```

`RarityBadge` uses `color-mix()` so it works in both light and dark mode.

---

## Dialogs & Alerts

Non-destructive: `<Dialog>`. Destructive confirmations: `<AlertDialog>`.

```tsx
<AlertDialog>
  <AlertDialogTrigger render={
    <Button variant="ghost" size="icon">
      <Trash2 className="h-4 w-4" />
    </Button>
  } />
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Smazat kartičku?</AlertDialogTitle>
      <AlertDialogDescription>Tato akce je nevratná.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Zrušit</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Smazat</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Navigation & Layout

### AppShell

`src/components/layout/AppShell.tsx` — wraps all protected pages. Checks `useAuthStore`, redirects to login if unauthenticated, shows a spinner while loading.

### AppSidebar

Desktop left sidebar. Gold brand colors, active item uses `--sidebar-primary`. Nav items: Dashboard, Players, Teams, Cards, Studio, Print, Achievements, Settings.

### AppTopbar

Desktop top bar: search field, theme toggle (`next-themes`), user avatar dropdown (`<DropdownMenu>`), mini XP progress bar.

### AppBottomNav

Mobile bottom navigation — 5 items: Dashboard, Players, Cards, Studio, Settings. `fixed bottom-0`, safe-area padding.

### PublicHeader

Landing page header — `.glass`, gold gradient logo, auth CTAs.

---

## Page Layout Patterns

### Standard protected page

```tsx
export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Hráči</h1>
        <Button asChild><Link href="./new">Nový hráč</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map(p => <PlayerCard key={p.id} player={p} />)}
      </div>
    </div>
  );
}
```

### Card editor page

Full-height two-column layout — canvas left, panels right:

```
Desktop:
┌─────────────────────────────────────────────────┐
│ ← Upravit kartičku          [Export PNG] [Uložit] │
├──────────────────┬──────────────────────────────┤
│                  │  [Content][Design][Effects]   │
│  Card canvas     │  ─────────────────────────    │
│  (280px wide)    │  Panel content               │
│  transform:      │                              │
│  scale(0.667)    │                              │
└──────────────────┴──────────────────────────────┘
```

The Konva stage is 420×588 px and displayed at 280px using `transform: scale(0.667)` + `transform-origin: top left`. The outer wrapper is sized to the display dimensions (`280×392`).

---

## CardPreview Component

CSS-only card display — no Konva. Use for collection grids, wizard previews, and any context where editing isn't needed.

```tsx
import { CardPreview } from "@/components/card/CardPreview";

<CardPreview card={card} player={player} size="md" />
<CardPreview card={card} size="sm" onClick={() => router.push(`/cards/${card.id}`)} />
```

| Size | Width | Height | Use |
|---|---|---|---|
| `sm` | 120px | 168px | Compact grid thumbnails |
| `md` | 210px | 294px | Wizard preview, lists |
| `lg` | 280px | 392px | Card detail page |

Rarity visual in CSS:
- `legendary` → `box-shadow: var(--shadow-card-legendary)`
- `mythic` → `.gradient-mythic` animated holographic
- Others → radial gradient tint using `color-mix(in oklch, rarityColor 12%, var(--card))`

---

## Card Editor Canvas

`CardEditorCanvas` must be loaded via `next/dynamic({ ssr: false })` in every page that uses it — Konva references `window` at module init.

```tsx
const CardEditorCanvas = dynamic(
  () => import("@/components/editor/CardEditorCanvas")
        .then(m => ({ default: m.CardEditorCanvas })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-[280px] h-[392px] rounded-xl" />,
  }
);
```

Stage: **420 × 588 px** (2.5:3.5 trading card ratio). Layers (bottom → top):

| Layer | Contents |
|---|---|
| Background | Gradient rect + rarity color tint, `cornerRadius: 16` |
| Photo | Player photo (cover-fit, top-aligned), bottom fade gradient |
| Stats | Stat boxes with value (Oswald Bold) + label (Inter) |
| Text | Player name + card type label |
| Effects | Konva shape overlays for the selected `card.effect` |
| Overlay | Card border stroke, rarity badge pill, jersey number |

### Card Effects

Drawn by `applyEffectToLayer()` from `src/lib/konvaEffects.ts`:

| `card.effect` | Visual treatment |
|---|---|
| `none` | Nothing |
| `goldFoil` | Two diagonal `Konva.Rect` with gold gradients (~25% opacity) |
| `hologram` | Rainbow diagonal gradient rect (~18% opacity) |
| `neon` | Tinted background + `Konva.Rect` with `shadowBlur: 24` neon stroke |
| `led` | Grid of `Konva.Circle` dots at 35% opacity |
| `fire` | Two overlapping warm gradient rects from bottom |

### Export

```ts
// src/lib/cardExport.ts
exportCardPNG(stage, cardId)
  → stage.toBlob({ pixelRatio: 3 })     // 1260×1764 px blob
  → uploadBytes(ref(storage, `cards/${cardId}/output.png`), blob)
  → getDownloadURL()
  → updateCard(cardId, { imageUrl: url, aiStatus: "done" })
```

---

## Loading States

Use `<Skeleton>` for all loading placeholders. Match shape and size of actual content:

```tsx
// Card grid skeleton
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  {Array.from({ length: 6 }).map((_, i) => (
    <Skeleton key={i} className="w-[210px] h-[294px] rounded-xl" />
  ))}
</div>

// Stat row skeleton
<div className="grid grid-cols-3 gap-2">
  {[1,2,3].map(n => <Skeleton key={n} className="h-16 rounded-xl" />)}
</div>
```

---

## Toasts

`react-hot-toast` — one `<Toaster>` in root layout. Call anywhere without prop drilling:

```ts
toast.success("Kartička uložena.");
toast.error("Chyba při ukládání.");
```

Never show raw Firebase error codes. Always map through:
```ts
import { getFirebaseErrorMessage } from "@/lib/utils";
toast.error(getFirebaseErrorMessage(error.code));
```

---

## i18n Conventions

- All user-facing strings via `useTranslations('namespace')` — never hardcode Czech or English strings in components.
- Locale always in URL: `/cs/...`, `/en/...`.
- Message files: `messages/cs.json` and `messages/en.json`.
- Middleware: `src/proxy.ts` (not `middleware.ts` — next-intl requirement).

```tsx
"use client";
import { useTranslations } from "next-intl";

export function ExampleComponent() {
  const t = useTranslations("cards");
  return <h1>{t("title")}</h1>;    // → "Kartičky" / "Cards"
}
```

Active namespaces: `common`, `nav`, `auth`, `dashboard`, `players`, `teams`, `matches`, `cards`, `editor`, `studio`, `achievements`, `print`, `settings`, `subscription`, `errors`.

---

## Accessibility

- All interactive elements keyboard-reachable.
- Icon-only buttons: `aria-label` required.
  ```tsx
  <Button size="icon" aria-label="Smazat kartičku"><Trash2 /></Button>
  ```
- Form fields: always paired with `<Label>` — no placeholder-only inputs.
- Decorative: `aria-hidden="true"` on emoji and purely visual elements.
- Color contrast: primary gold (`oklch(0.72 0.16 75)`) on dark backgrounds meets WCAG AA.

---

## File Locations

| What | Where |
|---|---|
| CSS tokens, gradient utilities, keyframes | `src/app/globals.css` |
| All TypeScript domain types | `src/types/index.ts` |
| All Firestore CRUD | `src/lib/firebaseServices.ts` |
| Rarity hex colors + Konva effect drawing | `src/lib/konvaEffects.ts` |
| Card business logic (rarity, stats, limits) | `src/lib/cardEngine.ts` |
| Card PNG export + Storage upload | `src/lib/cardExport.ts` |
| Auth store | `src/store/authStore.ts` |
| Domain entity stores | `src/store/appStore.ts` |
| shadcn/ui primitives | `src/components/ui/` |
| App layout components | `src/components/layout/` |
| Card display/generation components | `src/components/card/` |
| Konva card editor components | `src/components/editor/` |
| next-intl locale middleware | `src/proxy.ts` |
| Locale routing config | `src/i18n/routing.ts` |
