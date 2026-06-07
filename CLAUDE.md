# fcards-web — Project Conventions

## What this app is

**Fotbalové Kartičky** (Football Cards Forge) is a Czech football trading card platform for children (6–16), parents, coaches, and clubs. It lets players generate personalized collector cards from real match stats and photos, with AI-powered styling, a rarity system, gamified XP/leveling, social sharing, and physical print export.

### User roles

| Role | Can do |
|---|---|
| Guest | Browse public cards and templates, create account |
| Player | Create cards, manage profile, collect and share |
| Parent | Manage child profiles, order prints, approve public sharing |
| Coach | Manage teams, create players, generate team card sets |
| Club Admin | Manage multiple teams, create seasons, custom branding/templates |
| Super Admin | Full platform management (users, payments, moderation, AI prompts) |

---

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint

# Firebase Cloud Functions (in functions/ directory)
cd functions && npm run serve   # Local Functions emulator
cd functions && npm run deploy  # Deploy functions only
```

No test suite in v1 — do not attempt to run tests.

---

## Sibling projects for reference

```
c:\workspace\flive-web  — layout patterns, AppShell, auth flow reference
```

When unsure about a pattern, check flive-web first.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 (strict mode) |
| UI | shadcn/ui (base-nova, Tailwind v4) |
| State | Zustand 5 |
| Forms | react-hook-form + zod |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| Theming | next-themes (class-based, `.dark`) |
| i18n | next-intl 4 (Czech primary, English secondary) |
| Animation | framer-motion |
| Canvas | konva + react-konva |
| Export | html-to-image (previews), jsPDF (print PDFs) |
| QR codes | qrcode.react |
| Dates | date-fns |
| Auth | Firebase Auth |
| Database | Firestore |
| Storage | Firebase Storage |
| Functions | Firebase Cloud Functions |
| Analytics | Firebase Analytics |
| AI text | OpenAI GPT-4o-mini (Cloud Functions only) |
| AI images | Replicate API (Cloud Functions only) |
| PWA | Firebase Cloud Messaging + manifest.json |

---

## Architecture decisions

### Auth (client-side only)

- No Firebase Admin SDK, no session cookies, no server-side auth
- `AuthProvider` (`src/components/providers/AuthProvider.tsx`) listens to `onAuthStateChanged` → calls `getUserDoc` → writes to `useAuthStore`
- Route guards are in `AppShell` (client component) — not middleware
- **Race-condition fix**: call `setUser(newUser)` immediately on registration before `router.push`, so the store is populated before the redirect triggers AppShell's guard

### State management

Two Zustand stores, both defined in `src/store/`:
- `authStore.ts` — exports `useAuthStore`: `user`, `loading`, `setUser`, `setLoading`, `logout`
- `appStore.ts` — domain-namespaced sub-slices via separate `create()` calls, re-exported from one file: `usePlayersStore`, `useTeamsStore`, `useMatchesStore`, `useCardsStore`, `useAchievementsStore`

No other stores. No Zustand `combine`.

### Firestore access

All Firestore reads/writes go through `src/lib/firebaseServices.ts`. Never import `db` directly in components, stores, or hooks. Every document shape is defined in `src/types/index.ts`.

Every Firestore document has `createdAt: Timestamp` and `updatedAt: Timestamp`. User-scoped documents have `userId` or `ownerId` as a string field.

### Real-time listeners

No real-time Firestore listeners except one: while `card.aiStatus === "pending" | "processing"`, the card detail page opens an `onSnapshot` on `cards/{cardId}` to watch for AI completion. Close the listener when `aiStatus === "done" | "error"`.

### Canvas / Card Editor

- Konva.js owns the card editor — single `Stage` initialized once in `useEffect` via `useRef`, never recreated on re-render
- Card stage dimensions: **420 × 588 px** (standard 2.5:3.5 trading card ratio)
- Layers (bottom to top): Background → Template → Photo → Stats → Text → Effects → Overlay
- Effects (gold foil, hologram, neon, LED, fire) are Konva `Filter` objects — not CSS classes
- Full-quality export: `stage.toBlob({ pixelRatio: 3 })` → upload to Firebase Storage → update `card.imageUrl`
- Quick preview: `html-to-image` on a CSS card component (not Konva) for collection grid thumbnails

### AI calls

All OpenAI and Replicate API calls are made from Firebase Cloud Functions — **never from the client**. API keys are server-side only and never in `.env.local`.

Client flow:
1. Client calls Cloud Function HTTP endpoint: `POST /functionName { ...args }`
2. Function returns `{ jobId }` or updates card doc directly
3. Client opens `onSnapshot` on `cards/{cardId}` watching `aiStatus: "pending" | "processing" | "done" | "error"`
4. On `aiStatus === "done"`, read `card.imageUrl`

### Firebase Storage paths

```
users/{uid}/photos/{filename}          — player profile photos
cards/{cardId}/output.png              — generated/exported card image
cards/{cardId}/thumbnail.png           — collection grid thumbnail
clubs/{clubId}/logo/{filename}         — club logos
templates/{templateId}/preview.png    — template preview
```

### Monetization gating

Feature flags via Firebase Remote Config — do not hardcode tier limits in components. Gate pattern:

```ts
if (!canGenerateCard(user, currentMonthCount)) {
  showUpgradeDialog();
  return;
}
```

Subscription tier is stored on `user.subscriptionTier`. All gating logic lives in `src/lib/subscriptionEngine.ts`.

### Color system

Gold palette — hue **75** (amber gold), NOT 285 (violet from flive-web). Use `oklch()` full values everywhere.

Opacity modifiers like `bg-primary/50` do **not** work with CSS variable-based colors. Always use `color-mix(in oklch, var(--token) XX%, transparent)` in raw CSS.

Dark mode is class-based: apply `.dark` to `<html>`. `next-themes` handles this automatically.

### i18n

- Middleware file: `src/proxy.ts` (NOT `middleware.ts` — next-intl requires this)
- Routing config: `src/i18n/routing.ts`
- Request config: `src/i18n/request.ts`
- All routes under `src/app/[locale]/`
- All user-facing strings via `useTranslations('namespace')` — never hardcode Czech or English strings in components
- Locale prefix: always (`/cs/...`, `/en/...`)

### Fonts

```ts
import { Inter, Oswald } from "next/font/google";
const inter   = Inter({ variable: "--font-sans",    subsets: ["latin"] });
const oswald  = Oswald({ variable: "--font-display", subsets: ["latin"] });
```

- `--font-sans` (Inter) — all UI text, body, forms
- `--font-display` (Oswald) — card headings, player names, score displays

### shadcn/ui

- Style: `base-nova`, CSS variables enabled, Tailwind v4
- Add new components: `npx shadcn@latest add <component>`
- All components in `src/components/ui/`
- Never use Radix UI or Base UI primitives directly — always go through shadcn wrappers

---

## Firestore collections

```
users/{uid}
users/{uid}/players/{playerId}
teams/{teamId}
teams/{teamId}/members/{userId}
matches/{matchId}
matches/{matchId}/playerStats/{playerId}
cards/{cardId}
collections/{collectionId}
achievements/{achievementId}              # global achievement definitions
userAchievements/{uid}/{achievementId}
templates/{templateId}
clubs/{clubId}
```

---

## Required environment variables

```bash
# Client-side (NEXT_PUBLIC_ prefix required)
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

## Project structure

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx               # Root layout: providers, fonts
│       ├── page.tsx                 # Public landing page
│       ├── (protected)/             # Auth-guarded routes (AppShell)
│       │   ├── layout.tsx
│       │   ├── page.tsx             # Dashboard
│       │   ├── players/
│       │   ├── teams/
│       │   ├── cards/
│       │   ├── studio/
│       │   ├── print/
│       │   ├── achievements/
│       │   └── settings/
│       ├── auth/                    # login, register, reset
│       ├── player/[slug]/           # Public player profile
│       ├── card/[shareSlug]/        # Public card viewer
│       └── admin/                  # Super Admin only
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── layout/                      # AppShell, AppSidebar, AppTopbar, AppBottomNav, PublicHeader
│   ├── providers/                   # AuthProvider, ThemeProvider wrapper
│   ├── card/                        # CardPreview, RarityBadge, CardGeneratorWizard
│   ├── player/                      # PlayerCard, PlayerForm, PhotoUpload
│   ├── team/                        # TeamForm, TeamCard, TeamRoster, InvitePanel
│   ├── match/                       # MatchForm, StatsEntryForm
│   ├── editor/                      # CardEditorCanvas, EditorToolbar, panels
│   ├── studio/                      # AI Studio components
│   ├── print/                       # PrintFormatSelector, CardSelectionGrid
│   ├── collection/                  # CollectionGrid, CollectionFilters, SeasonAlbum
│   ├── achievements/                # AchievementCard, XPBar, LevelBadge
│   ├── share/                       # ShareButtons, QRCodePanel
│   ├── subscription/                # UpgradeDialog
│   ├── club/                        # ClubForm, ClubBrandingEditor
│   └── admin/                       # Admin UI components
├── lib/
│   ├── firebase.ts                  # Firebase init — exports auth, db, storage
│   ├── firebaseServices.ts          # All Firestore CRUD — only place db is used
│   ├── utils.ts                     # cn(), getFirebaseErrorMessage(), formatDate(), getRarityColor(), getLevelFromXP()
│   ├── cardEngine.ts                # Pure business logic: rarity, XP, card generation
│   ├── cardExport.ts                # Konva PNG export + Storage upload
│   ├── konvaEffects.ts              # Konva Filter setup for each card effect
│   ├── achievementEngine.ts         # checkAchievements() pure function
│   ├── xpEngine.ts                  # addXP(), getLevelFromXP(), getUnlockables()
│   ├── printEngine.ts               # jsPDF export functions
│   ├── subscriptionEngine.ts        # Feature gating functions
│   └── shareUtils.ts                # Social share URL builders
├── store/
│   ├── authStore.ts                 # useAuthStore
│   └── appStore.ts                  # usePlayersStore, useTeamsStore, useMatchesStore, useCardsStore, useAchievementsStore
├── types/
│   └── index.ts                     # All domain types and interfaces
├── hooks/
│   ├── use-auth-forms.ts
│   ├── use-aggregate-stats.ts
│   ├── use-collection.ts
│   ├── use-card-editor.ts
│   ├── use-ai-generation.ts
│   ├── use-share.ts
│   └── use-subscription.ts
└── i18n/
    ├── routing.ts
    └── request.ts

messages/
├── cs.json                          # Czech strings (primary)
└── en.json                          # English strings

functions/                           # Firebase Cloud Functions (separate package.json)
├── src/
│   ├── index.ts                     # All callable function exports
│   ├── ai/                          # AI feature functions
│   └── notifications/               # FCM functions
└── package.json

scripts/
├── seed-templates.ts                # Seed initial card templates
└── seed-achievements.ts             # Seed achievement definitions

public/
├── manifest.json                    # PWA manifest
└── sw.js                            # Service worker
```
