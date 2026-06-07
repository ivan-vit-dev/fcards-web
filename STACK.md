# fcards-web — Stack & Architecture

This document records the exact technology choices, conventions, and architectural decisions for the fcards-web project. Keep it up to date as phases are completed.

---

## Tech Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.7 | App Router, Turbopack |
| Language | TypeScript | 5 (strict) | `"strict": true` in tsconfig |
| Runtime | React | 19.2.4 | Server + Client components |
| UI components | shadcn/ui | 4.10 | style `base-nova`, CSS variables |
| Styling | Tailwind CSS | 4 | CSS variables for all tokens |
| Theme | next-themes | 0.4.6 | class-based `.dark` on `<html>` |
| Icons | lucide-react | 1.17 | no other icon libraries |
| Animations | framer-motion | 12.40 | page transitions, card reveals |
| State | Zustand | 5.0 | two stores: authStore + appStore |
| Forms | react-hook-form + zod | 7.77 / 4.4 | always pair together |
| Toasts | react-hot-toast | 2.6 | one `<Toaster>` in root layout |
| i18n | next-intl | 4.13 | locale in URL path, `src/proxy.ts` |
| Canvas | konva | 10.3 | card editor engine (client-only) |
| Canvas bindings | react-konva | 19.2 | not used — raw Konva API instead |
| Quick export | html-to-image | 1.11 | CSS-based PNG for thumbnails |
| Print export | jspdf | 4.2 | PDF assembly for print center |
| QR codes | qrcode.react | 4.2 | card/player sharing |
| Dates | date-fns | 4.4 | formatting only |
| Auth | Firebase Auth | 12.14 | email/password + Google OAuth |
| Database | Firestore | 12.14 | client SDK only, no Admin SDK |
| Storage | Firebase Storage | 12.14 | card images, player photos |
| Functions | Firebase Cloud Functions | — | all AI and sensitive server logic |
| Analytics | Firebase Analytics | 12.14 | client-side, lazy-loaded |
| AI text | OpenAI GPT-4o-mini | — | Cloud Functions only |
| AI images | Replicate | — | Cloud Functions only |
| PWA | Firebase Cloud Messaging + manifest | — | Phase 15 |
| Fonts | Inter + Oswald | Google Fonts | via `next/font/google` |

---

## Project Structure

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx                    # AuthProvider, ThemeProvider, Toaster, fonts
│       ├── page.tsx                      # Public landing page
│       ├── (protected)/
│       │   ├── layout.tsx               # Wraps AppShell (route guard)
│       │   ├── page.tsx                 # Dashboard
│       │   ├── players/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx
│       │   │   └── [playerId]/page.tsx
│       │   ├── teams/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx
│       │   │   └── [teamId]/
│       │   │       ├── page.tsx
│       │   │       └── matches/[matchId]/page.tsx
│       │   ├── cards/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx
│       │   │   └── [cardId]/
│       │   │       ├── page.tsx
│       │   │       └── edit/page.tsx    ← Phase 6
│       │   ├── matches/page.tsx
│       │   ├── studio/                  ← Phase 9
│       │   ├── print/                   ← Phase 11
│       │   ├── achievements/            ← Phase 8
│       │   └── settings/               ← Phase 12
│       ├── auth/
│       │   ├── layout.tsx              # Redirect if logged in
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── reset/page.tsx
│       ├── player/[slug]/page.tsx       # Public player profile
│       ├── card/[shareSlug]/page.tsx    # Public card viewer
│       └── admin/                       ← Phase 14
├── components/
│   ├── ui/                             # shadcn/ui only — do not put custom components here
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── layout/
│   │   ├── AppShell.tsx               # Route guard + layout wrapper
│   │   ├── AppSidebar.tsx
│   │   ├── AppTopbar.tsx
│   │   ├── AppBottomNav.tsx           # Mobile 5-item nav
│   │   └── PublicHeader.tsx
│   ├── card/
│   │   ├── CardPreview.tsx            # CSS-only card display (no Konva)
│   │   ├── RarityBadge.tsx
│   │   └── CardGeneratorWizard.tsx
│   ├── editor/                         # Phase 6 — Konva card editor
│   │   ├── CardEditorCanvas.tsx       # Konva stage, initialized once in useEffect
│   │   ├── EditorToolbar.tsx
│   │   ├── ContentPanel.tsx
│   │   ├── DesignPanel.tsx
│   │   └── EffectsPanel.tsx
│   ├── player/
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerForm.tsx
│   │   └── PhotoUpload.tsx
│   ├── team/
│   │   ├── TeamCard.tsx
│   │   ├── TeamForm.tsx
│   │   ├── TeamRoster.tsx
│   │   └── InvitePanel.tsx
│   └── match/
│       ├── MatchForm.tsx
│       └── StatsEntryForm.tsx
├── lib/
│   ├── firebase.ts                     # Exports auth, db, storage
│   ├── firebaseServices.ts             # ALL Firestore CRUD — nowhere else
│   ├── utils.ts                        # cn(), getFirebaseErrorMessage(), etc.
│   ├── cardEngine.ts                   # Rarity, stats, slug, generation limits
│   ├── cardExport.ts                   # stage.toBlob → Storage → updateCard
│   ├── konvaEffects.ts                 # Konva layer draw functions per effect
│   ├── achievementEngine.ts            # Phase 8
│   ├── xpEngine.ts                     # Phase 8
│   ├── printEngine.ts                  # Phase 11
│   └── subscriptionEngine.ts           # Phase 12
├── store/
│   ├── authStore.ts                    # useAuthStore: user, loading, setUser, logout
│   └── appStore.ts                     # usePlayersStore, useTeamsStore, useMatchesStore,
│                                       #   useCardsStore, useAchievementsStore
├── hooks/
│   ├── use-auth-forms.ts
│   ├── use-aggregate-stats.ts
│   ├── use-card-editor.ts              # Phase 6
│   ├── use-collection.ts               # Phase 7
│   ├── use-ai-generation.ts            # Phase 9
│   ├── use-share.ts                    # Phase 10
│   └── use-subscription.ts             # Phase 12
├── types/
│   └── index.ts                        # All domain types — single source of truth
└── i18n/
    ├── routing.ts
    └── request.ts

messages/
├── cs.json                             # Czech (primary)
└── en.json

functions/                              # Firebase Cloud Functions — separate package.json
├── src/
│   ├── index.ts
│   └── ai/
└── package.json

public/
├── manifest.json
└── sw.js
```

---

## Routing

- All routes under `src/app/[locale]/`.
- Middleware: `src/proxy.ts` — locale detection only via next-intl. No auth logic in middleware.
- Route guard: `AppShell` (client component) checks `useAuthStore`. Not middleware, not server-side.
- Locales: `cs` (primary), `en`. Always with locale prefix (`/cs/...`, `/en/...`).
- Navigation: `useRouter()` + `useParams()` from `next/navigation`.

---

## Auth

Fully **client-side**. No Firebase Admin SDK, no session cookies, no server-side protection.

```
onAuthStateChanged → getUserDoc() → useAuthStore.setUser()
```

- **`AuthProvider`** in locale layout: listens to `onAuthStateChanged`, fetches Firestore user doc, writes to store.
- **Protected routes**: `AppShell` reads `useAuthStore`. Loading → spinner. No user → redirect to login.
- **Auth pages**: `src/app/[locale]/auth/layout.tsx` redirects logged-in users away.
- **Registration race fix**: call `setUser(newUser)` immediately after `createUserDoc()`, before `router.push()`. AuthProvider will overwrite with the same data.

```ts
// authStore shape
{ user: User | null; loading: boolean; setUser; setLoading; logout }
```

---

## State Management

Two Zustand 5 stores only. Do not create a third — extend `appStore` instead.

| Store | Hook | Contents |
|---|---|---|
| `authStore.ts` | `useAuthStore` | `user`, `loading`, `setUser`, `setLoading`, `logout` |
| `appStore.ts` | `usePlayersStore`, `useTeamsStore`, `useMatchesStore`, `useCardsStore`, `useAchievementsStore` | Domain entity lists + CRUD actions |

Data flow: Firestore → `firebaseServices.ts` → store setter → component.

---

## Firebase

```ts
// src/lib/firebase.ts exports
export { auth, db, storage }
```

- Placeholder fallback config values so dev server starts without credentials.
- All Firestore reads/writes in `firebaseServices.ts` — no `db` imports anywhere else.
- Firebase Storage used for: player photos, card exports, club logos, template previews.

### Firestore collections

```
users/{uid}
users/{uid}/players/{playerId}
teams/{teamId}
teams/{teamId}/members/{userId}
matches/{matchId}
matches/{matchId}/playerStats/{playerId}
cards/{cardId}
collections/{collectionId}
achievements/{achievementId}
userAchievements/{uid}/{achievementId}
templates/{templateId}
clubs/{clubId}
```

Every document: `createdAt` + `updatedAt` (`Timestamp`). User-scoped documents: `userId` or `ownerId`.

### Firebase Storage paths

```
users/{uid}/photos/{filename}        — player profile photos
cards/{cardId}/output.png            — full-quality exported card
cards/{cardId}/thumbnail.png         — collection grid thumbnail
clubs/{clubId}/logo/{filename}       — club logos
templates/{templateId}/preview.png  — template preview
```

### Required env vars

```bash
# Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Server-side — Cloud Functions only, NEVER in .env.local
OPENAI_API_KEY
REPLICATE_API_KEY
```

---

## Color System

**Dark Gold / Premium palette** — hue 75 (amber gold). NOT hue 285 (violet from flive-web).

All tokens use `oklch()` full values. Opacity modifiers (`bg-primary/50`) do **not** work with CSS variable colors. Use `color-mix(in oklch, var(--token) XX%, transparent)` instead.

Key tokens:

| Token | Light | Dark |
|---|---|---|
| `--primary` | `oklch(0.72 0.16 75)` — rich amber gold | `oklch(0.78 0.17 75)` — bright gold |
| `--background` | `oklch(0.98 0.005 75)` — near-white warm | `oklch(0.10 0.010 75)` — near-black |
| `--brand-accent` | `oklch(0.65 0.14 55)` — burnt orange | `oklch(0.70 0.15 55)` |
| `--shadow-glow` | `0 0 24px oklch(0.72 0.16 75 / 0.35)` | `0 0 28px oklch(0.78 0.17 75 / 0.40)` |

See `src/app/globals.css` for the full token set and `@layer utilities` (gradient classes, glass, shadow utilities).

### Rarity tokens

| Rarity | Token | Hex approx (canvas) |
|---|---|---|
| common | `--rarity-common` | `#888888` |
| uncommon | `--rarity-uncommon` | `#22c55e` |
| rare | `--rarity-rare` | `#4f8ef7` |
| epic | `--rarity-epic` | `#b06cf8` |
| legendary | `--rarity-legendary` | `#c9a227` |
| mythic | animated holographic gradient | `#c9a227` + animation |
| limited | `--rarity-limited` | `#ef4444` |

Rarity CSS tokens resolve as CSS variables — use them in components. For Konva canvas, use `RARITY_COLORS_CANVAS` from `src/lib/konvaEffects.ts`.

---

## Typography

```ts
import { Inter, Oswald } from "next/font/google";
const inter   = Inter({ variable: "--font-sans",    subsets: ["latin"] });
const oswald  = Oswald({ variable: "--font-display", subsets: ["latin"] });
```

| Use case | Font | Tailwind class |
|---|---|---|
| All body text, UI, forms | Inter | `font-sans` (default) |
| Card headings, player names, stat numbers | Oswald Bold | `font-display font-bold` |

---

## Card Editor (Konva)

The card editor uses raw Konva.js — **not** react-konva declarative JSX.

- **Stage size**: 420 × 588 px (standard 2.5:3.5 trading card ratio)
- **Initialization**: once in `useEffect` via `useRef`. Never recreate on re-render. Update layers imperatively.
- **Layers** (bottom → top): Background → Photo → Stats → Text → Effects → Overlay
- **Loading**: `CardEditorCanvas` must be loaded via `next/dynamic({ ssr: false })` because Konva references `window` during module init
- **Effects** (goldFoil, hologram, neon, led, fire): drawn as Konva shapes on the Effects layer via `applyEffectToLayer()` in `konvaEffects.ts`
- **Display scaling**: Canvas stays at 420×588; use CSS `transform: scale(displayScale)` to shrink for display
- **Export**: `stage.toBlob({ pixelRatio: 3 })` → 1260×1764 blob → Firebase Storage → `card.imageUrl`

```ts
// Export chain
exportCardPNG(stage, cardId)  // src/lib/cardExport.ts
  → stage.toBlob({ pixelRatio: 3 })
  → uploadBytes(ref(storage, `cards/${cardId}/output.png`), blob)
  → getDownloadURL()
  → updateCard(cardId, { imageUrl, aiStatus: "done" })
```

---

## AI Calls

All OpenAI and Replicate API calls go through Firebase Cloud Functions — **never from the client**.

```
Client → POST /functionName { ...args }
       → Function returns { jobId } or updates card doc directly
       → Client opens onSnapshot on cards/{cardId}
       → Watches aiStatus: "pending" | "processing" | "done" | "error"
       → On "done": read card.imageUrl
```

Close the `onSnapshot` listener when `aiStatus === "done" | "error"`.

---

## Subscription Gating

Feature flags via Firebase Remote Config — do not hardcode tier limits in components.

```ts
if (!canGenerateCard(user, currentMonthCount)) {
  showUpgradeDialog();
  return;
}
```

Subscription tier: `user.subscriptionTier`. All gating logic: `src/lib/subscriptionEngine.ts`.

---

## UI Conventions

- **shadcn/ui** for all UI primitives — never import from `@radix-ui/*` directly in feature code.
- **Never hardcode** Czech or English strings in components — always use `useTranslations('namespace')`.
- **Toasts**: `toast.success()` / `toast.error()` from react-hot-toast — one `<Toaster>` in root layout.
- **Forms**: react-hook-form + zod. Schema first, derive type from it. Field errors inline, not in toasts.
- **Icons**: lucide-react only.
- **No MUI, Ant Design, Chakra, or other UI libraries.**

---

## Implementation Status

| Phase | Description | Status |
|---|---|---|
| 0 | Project bootstrap | ✅ Done |
| 1 | Auth foundation | ✅ Done |
| 2 | App shell & navigation | ✅ Done |
| 3 | Player profiles | ✅ Done |
| 4 | Teams & matches | ✅ Done |
| 5 | Card templates & generator | ✅ Done |
| 6 | Card editor (Konva) | ✅ Done |
| 7 | Collections & rarity browser | 🔲 Next |
| 8 | Achievements & XP | 🔲 Pending |
| 9 | AI Studio | 🔲 Pending |
| 10 | Social & sharing | 🔲 Pending |
| 11 | Print center | 🔲 Pending |
| 12 | Subscription & gating | 🔲 Pending |
| 13 | Club mode | 🔲 Pending |
| 14 | Admin panel | 🔲 Pending |
| 15 | PWA & polish | 🔲 Pending |
| 16 | Production hardening | 🔲 Pending |
