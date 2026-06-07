# Fotbalové Kartičky (fcards-web) — Full Implementation Plan

## Context

Building a new Czech football trading card platform from scratch at `c:\workspace\fcards-web`. The app lets children (6–16), parents, coaches, and clubs generate, collect, share, and print personalized football cards based on real player stats. It mirrors the architecture conventions of the sibling FLive project (`c:\workspace\flive-web`) but with a new **Dark Gold / Premium** color palette and an extended stack covering a Konva.js card editor, AI image generation via Replicate, and print/PDF export.

The three first deliverables before any feature code are:
1. **`CLAUDE.md`** — project conventions file so future Claude sessions start with full context
2. **`SPECS.md`** — comprehensive technical specification (types, routes, rarity rules, XP table, AI endpoints, print formats, Firestore rules)
3. **`APP_DESIGN.md`** — design system document mirroring flive-web's APP_DESIGN.md but with the gold palette

---

## Deliverable 1 — CLAUDE.md

File: `c:\workspace\fcards-web\CLAUDE.md`

### Sections to include

**Commands**
```
npm run dev          # localhost:3000
npm run build        # production build
npm run lint         # ESLint
cd functions && npm run serve   # Firebase emulator for Cloud Functions
```
No test suite in v1 — state this explicitly.

**What this app is**
Two-sentence summary + 6 user roles (Guest, Player, Parent, Coach, Club Admin, Super Admin) with one-line capability per role.

**Sibling projects**
```
c:\workspace\flive-web  — layout patterns, AppShell, auth flow reference
```

**Architecture decisions that diverge from STACK.md**
- Auth: Zustand (not React Context). `AuthProvider` → `useAuthStore`. Race-condition fix: call `setUser(newUser)` immediately on registration before `router.push`.
- State: Two stores in one file (`src/store/authStore.ts` + `appStore.ts`). `appStore` uses domain-namespaced sub-slices via separate `create()` calls re-exported from one file.
- No real-time Firestore listeners — load on demand. Exception: `onSnapshot` on `cards/{cardId}` while `aiStatus === "pending"` for AI generation progress.
- Canvas: Konva.js owns the card editor. Initialize once in `useEffect` with `useRef` to stage — never recreate on re-render, update layers imperatively.
- PDF/Export: `html-to-image` for quick collection preview PNGs. `jsPDF` for multi-card PDF assembly. Konva `stage.toBlob({ pixelRatio: 3 })` for the full-quality card export.
- AI calls: All OpenAI + Replicate calls go through Firebase Cloud Functions — never from the client. Client POST → Cloud Function returns `{ jobId }` → client polls via `onSnapshot` on `cards/{cardId}.aiStatus`.
- Storage paths: `users/{uid}/photos/{filename}` for uploads, `cards/{cardId}/output.png` for generated card images.
- Color system: `oklch()` full values, hue 75 (gold), NOT hue 285 (violet from flive-web). Opacity modifiers do not work — use `color-mix(in oklch, var(--token) XX%, transparent)`.
- i18n: `src/proxy.ts` (not `middleware.ts`). Czech primary (`cs`), English secondary (`en`).

**Firestore collections**
```
users/{uid}
users/{uid}/players/{playerId}
teams/{teamId}
teams/{teamId}/members/{userId}
matches/{matchId}
matches/{matchId}/playerStats/{playerId}
cards/{cardId}
collections/{collectionId}
achievements/{achievementId}           # global definitions
userAchievements/{uid}/{achievementId}
templates/{templateId}
clubs/{clubId}
```
Every doc: `createdAt` + `updatedAt` Timestamps. User-scoped docs have `userId` or `ownerId`.

**Card editor constraints**
- Konva stage size: 420 × 588 px (standard 2.5:3.5 ratio)
- Layers bottom-to-top: Background → Template → Photo → Stats → Text → Effects → Overlay
- Export: `stage.toBlob()` → Firebase Storage → update `card.imageUrl`
- Effects (gold foil, hologram, neon, LED, fire) are Konva Filters on the image layer, not CSS

**AI Studio constraints**
- All AI functions are HTTP-callable Firebase Cloud Functions
- Client pattern: `POST /generateCardAI` → `{ jobId }` → `onSnapshot` on `cards/{cardId}` watching `aiStatus: "pending"|"processing"|"done"|"error"`

**Monetization gating**
- Feature flags via Firebase Remote Config — do not hardcode tier limits
- Gate pattern: `if (!canGenerateCard()) { showUpgradeDialog(); return; }`

**Required env vars**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
# Server-side (Cloud Functions only — never in .env.local):
OPENAI_API_KEY
REPLICATE_API_KEY
```

**shadcn/ui** — CSS variables enabled, style `base-nova`. Add new components with `npx shadcn@latest add <component>`.

**i18n** — all user-facing strings via `useTranslations()`, locale in URL. Same convention as flive-web CLAUDE.md.

---

## Deliverable 2 — SPECS.md

File: `c:\workspace\fcards-web\SPECS.md`

### Sections

1. **Product Overview** — executive summary, user groups, key differentiators (Career Timeline, AI Studio, Print-to-Physical, Digital Sticker Album)

2. **User Roles & Permissions Matrix** — table: rows = roles, columns = capabilities (create card, manage team, view analytics, moderate, etc.)

3. **Subscription Tiers** — table: Free / Premium / Team / Club with exact limits (cards/month, AI credits/month, HD export, template access, storage quota)

4. **Complete Data Model** — Full TypeScript interfaces for every Firestore document (authoritative source for `src/types/index.ts`):

   Key interfaces: `User`, `Player`, `Team`, `Match`, `PlayerMatchStats`, `Card`, `Template`, `Achievement`, `UserAchievement`, `Club`

   Key union types:
   ```ts
   type UserRole = "guest"|"player"|"parent"|"coach"|"clubAdmin"|"superAdmin"
   type CardType = "match"|"mvp"|"season"|"achievement"|"team"|"tournament"|"birthday"|"farewell"|"champion"|"rookie"
   type Rarity = "common"|"uncommon"|"rare"|"epic"|"legendary"|"mythic"|"limited"
   type AIStyle = "fifa"|"panini"|"comic"|"anime"|"cartoon"|"fantasy"|"superhero"
   type PlayerPosition = "goalkeeper"|"defender"|"midfielder"|"forward"
   type SubscriptionTier = "free"|"premium"|"team"|"club"
   ```

5. **Rarity System** — for each of 7 rarities: display name (cs/en), CSS token, visual treatment, how it's awarded, which templates it unlocks

6. **XP & Leveling** — XP event table (create card +50, share +25, complete match stats +100, receive MVP +200, unlock achievement +varies, complete season +500), level 1–100 thresholds, unlocks per level (frames/effects/templates)

7. **Achievement Specification** — 20+ achievements. For each: id/key, Czech name, trigger condition (metric + threshold), XP reward, associated card type, lucide-react icon name. Examples:
   - `goal_machine_100`: "Střelecký stroj" — 100 career goals — +500 XP — Legendary — Trophy
   - `iron_man_50`: "Železný muž" — 50 matches played — +300 XP — Epic — Shield
   - `captain_10`: "Kapitán" — 10 matches as captain — +250 XP — Rare — Star

8. **Card Generator Specification** — for each of 10 card types: trigger conditions, required data, default template category, default rarity range, auto-generation rules (e.g., MVP card auto-triggers when `isMVP=true` set on match stats)

9. **AI Studio Specification** — for each of 7 AI features:
   - Cloud Function name, Replicate model or OpenAI endpoint
   - Input/output schema, estimated latency, retry policy
   - Tier requirement, credit cost per use

10. **Route Map** — complete route table:
    ```
    Public:  /[locale]/  |  /[locale]/player/[slug]  |  /[locale]/card/[shareSlug]  |  /[locale]/auth/*
    Protected: /[locale]/dashboard  |  /players/*  |  /teams/*  |  /cards/*  |  /studio  |  /print  |  /achievements  |  /settings/*
    Admin: /[locale]/admin/*  (Super Admin only)
    ```

11. **Cloud Functions API** — for each function: name, input schema (zod), output schema, auth requirement, rate limit, timeout, error codes

12. **Print Specification** — for each format (A4, A5, sticker 9-up, sticker 12-up, album PDF, team pack): dimensions in mm, bleed, DPI, jsPDF page setup

13. **Social Sharing Specification** — for each platform: share URL template, image size requirement, Czech caption template, Web Share API usage, fallback

14. **Firestore Security Rules** — complete `firestore.rules` content

15. **Firestore Indexes** — composite indexes:
    - `cards`: `userId` ASC + `createdAt` DESC
    - `cards`: `playerId` ASC + `rarity` ASC + `createdAt` DESC
    - `cards`: `isPublic` ASC + `createdAt` DESC
    - `teams`: `coachId` ASC + `createdAt` DESC
    - `matches`: `teamId` ASC + `date` DESC

16. **Design System** — full CSS token table (see color palette section below)

17. **PWA Specification** — manifest fields, FCM topics (`card_ready`, `achievement_unlocked`, `team_invite`), offline cache strategy, install prompt trigger

---

## Deliverable 3 — APP_DESIGN.md

File: `c:\workspace\fcards-web\APP_DESIGN.md`

Same structure as `c:\workspace\flive-web\APP_DESIGN.md` but with the gold palette tokens, rarity utilities, holographic animation, and card-specific components (CardPreview, RarityBadge, XPBar, LevelBadge). Copy sections: Typography, Buttons, Toggle Chips, Input Fields, Cards, Badges, Dialogs, Navigation, Tabs, Page Layouts, Accessibility, i18n Conventions, File Locations. Replace all color tokens with the gold palette below.

---

## Color Palette — Dark Gold / Premium

### Light mode (`:root`)
```css
--background:           oklch(0.98 0.005 75);
--foreground:           oklch(0.12 0.015 75);
--card:                 oklch(1 0 0);
--card-foreground:      oklch(0.12 0.015 75);
--popover:              oklch(1 0 0);
--popover-foreground:   oklch(0.12 0.015 75);
--primary:              oklch(0.72 0.16 75);     /* rich amber gold */
--primary-foreground:   oklch(0.10 0.01 75);
--secondary:            oklch(0.93 0.020 75);
--secondary-foreground: oklch(0.25 0.06 75);
--muted:                oklch(0.92 0.008 75);
--muted-foreground:     oklch(0.50 0.020 75);
--accent:               oklch(0.90 0.018 55);
--accent-foreground:    oklch(0.20 0.05 55);
--brand-accent:         oklch(0.65 0.14 55);     /* burnt orange */
--destructive:          oklch(0.577 0.245 27);
--destructive-foreground: oklch(0.98 0 0);
--border:               oklch(0.88 0.010 75);
--input:                oklch(0.88 0.010 75);
--ring:                 oklch(0.72 0.16 75);
--radius:               0.75rem;
/* Sidebar */
--sidebar:              oklch(0.96 0.010 75);
--sidebar-foreground:   oklch(0.12 0.015 75);
--sidebar-primary:      oklch(0.72 0.16 75);
--sidebar-primary-foreground: oklch(0.10 0.01 75);
--sidebar-accent:       oklch(0.90 0.018 75);
--sidebar-accent-foreground: oklch(0.25 0.06 75);
--sidebar-border:       oklch(0.88 0.010 75);
--sidebar-ring:         oklch(0.72 0.16 75);
/* Rarity */
--rarity-common:        oklch(0.65 0.01 0);
--rarity-uncommon:      oklch(0.60 0.15 145);
--rarity-rare:          oklch(0.55 0.22 258);
--rarity-epic:          oklch(0.55 0.22 300);
--rarity-legendary:     oklch(0.72 0.16 75);
--rarity-limited:       oklch(0.55 0.25 15);
/* Shadows */
--shadow-glow:          0 0 24px oklch(0.72 0.16 75 / 0.35);
--shadow-card-legendary: 0 0 32px oklch(0.72 0.16 75 / 0.50);
```

### Dark mode (`.dark`)
```css
--background:           oklch(0.10 0.010 75);
--foreground:           oklch(0.95 0.005 75);
--card:                 oklch(0.15 0.015 75);
--card-foreground:      oklch(0.95 0.005 75);
--primary:              oklch(0.78 0.17 75);     /* bright gold */
--primary-foreground:   oklch(0.10 0.01 75);
--secondary:            oklch(0.20 0.015 75);
--secondary-foreground: oklch(0.90 0.005 75);
--muted:                oklch(0.22 0.015 75);
--muted-foreground:     oklch(0.60 0.015 75);
--accent:               oklch(0.25 0.018 55);
--accent-foreground:    oklch(0.85 0.010 55);
--brand-accent:         oklch(0.70 0.15 55);
--border:               oklch(1 0 0 / 9%);
--input:                oklch(1 0 0 / 12%);
--ring:                 oklch(0.78 0.17 75);
--sidebar:              oklch(0.13 0.012 75);
--sidebar-foreground:   oklch(0.90 0.005 75);
--sidebar-primary:      oklch(0.78 0.17 75);
--sidebar-primary-foreground: oklch(0.10 0.01 75);
--sidebar-accent:       oklch(0.22 0.018 75);
--sidebar-accent-foreground: oklch(0.88 0.008 75);
--sidebar-border:       oklch(1 0 0 / 8%);
--rarity-common:        oklch(0.68 0.01 0);
--rarity-uncommon:      oklch(0.65 0.16 145);
--rarity-rare:          oklch(0.62 0.23 258);
--rarity-epic:          oklch(0.62 0.23 300);
--rarity-legendary:     oklch(0.78 0.17 75);
--rarity-limited:       oklch(0.60 0.26 15);
--shadow-glow:          0 0 28px oklch(0.78 0.17 75 / 0.40);
--shadow-card-legendary: 0 0 40px oklch(0.78 0.17 75 / 0.60);
```

### Gradient utilities (`@layer utilities`)
```css
.gradient-brand      /* 135deg gold→orange, main CTAs */
.gradient-text       /* same gradient clipped to text, app name/accents */
.gradient-hero       /* subtle gold wash for landing hero */
.gradient-card-legendary  /* radial gold overlay for legendary cards */
.gradient-mythic     /* animated holographic: blue→purple→gold→green, 4s loop */
.glass               /* frosted glass: backdrop-blur(16px) + border */
.shadow-glow         /* var(--shadow-glow) */
.shadow-card-legendary   /* var(--shadow-card-legendary) */
```

### Tailwind keyframes
- `holographic` — backgroundPosition 0%→100% 4s infinite (mythic cards)
- `card-reveal` — rotateY 90°→0° + scale 0.8→1, spring easing (new card generation)
- `shimmer` — backgroundPosition sweep 2s infinite (loading skeletons, gold foil)

---

## Stack

Same as `STACK.md` plus:

| Addition | Version | Purpose |
|---|---|---|
| Next.js | 15 (stable, React 19) | Framework upgrade from STACK.md's 14 |
| konva | ^9.3 | Card editor canvas engine |
| react-konva | ^18.2 | React bindings for Konva |
| html-to-image | ^1.11 | Quick PNG for collection previews |
| jspdf | ^2.5 | PDF assembly for print center |
| qrcode.react | ^4.0 | QR codes for card/player sharing |
| date-fns | ^3.6 | Date formatting |
| framer-motion | ^12.0 | Page transitions, card reveal animations |
| openai | ^4.0 | Card story + commentary (Cloud Functions only) |
| replicate | ^1.0 | Image AI: bg removal, style transfer, pose (Cloud Functions only) |
| Oswald | Google Font | Display font for card headings and player names |

**Cloud Functions** (`functions/`): separate `package.json` with `firebase-admin`, `firebase-functions`, `openai`, `replicate`.

---

## Implementation Phases

### Phase 0 — Project Bootstrap
1. Scaffold Next.js 15 app: `npx create-next-app@latest fcards-web --typescript --tailwind --app`
2. Set `"strict": true` in `tsconfig.json`
3. Install all production deps (see Stack table above + firebase, zustand, react-hook-form, zod, react-hot-toast, lucide-react, next-themes, next-intl, class-variance-authority, clsx, tailwind-merge)
4. `npx shadcn@latest init` — style `base-nova`, CSS variables `yes`
5. Add shadcn components: button card dialog dropdown-menu input label select separator skeleton tabs textarea badge avatar progress tooltip popover accordion alert-dialog switch checkbox scroll-area sheet slider
6. Create directory tree: `src/app/[locale]/(protected)/`, `src/app/[locale]/auth/`, `src/components/ui|layout|providers|card|player|team|match|editor|studio|print|collection|achievements|share|subscription|club|admin/`, `src/lib/`, `src/store/`, `src/types/`, `src/hooks/`, `messages/`
7. Create `src/proxy.ts` (next-intl locale middleware — NOT `middleware.ts`)
8. Create `src/i18n/request.ts`
9. Create `messages/cs.json` + `messages/en.json` with namespace stubs for all 16 modules
10. Create `.env.local` from `.env.example`
11. Create `src/lib/firebase.ts` — init with placeholder fallback config pattern
12. Write `src/app/globals.css` — complete gold palette token set (see above)
13. Write `tailwind.config.ts` — color extensions for rarity tokens, keyframes
14. **Create `CLAUDE.md`** — full content per Deliverable 1 above
15. **Create `SPECS.md`** — full content per Deliverable 2 above
16. **Create `APP_DESIGN.md`** — full content per Deliverable 3 above

### Phase 1 — Auth Foundation
1. `src/types/index.ts` — all union types + full interfaces for `User`, `Player`, `Team`, `Match`, `Card`, `Template`, `Achievement`, `UserAchievement`, `Club`
2. `src/store/authStore.ts` — `user`, `loading`, `setUser`, `setLoading`, `logout`
3. `src/store/appStore.ts` — domain-namespaced slices (players, teams, matches, cards, achievements)
4. `src/lib/utils.ts` — `cn()`, `getFirebaseErrorMessage()`, `formatDate()`, `getRarityColor()`, `getLevelFromXP()`
5. `src/lib/firebaseServices.ts` — `getUserDoc`, `createUserDoc`, stubs for all other services
6. `src/components/providers/AuthProvider.tsx` — `onAuthStateChanged` → `getUserDoc` → `useAuthStore`
7. `src/app/[locale]/layout.tsx` — mount `NextIntlClientProvider`, `ThemeProvider`, `AuthProvider`, `Toaster`, load `Inter` + `Oswald` fonts
8. `src/app/[locale]/auth/layout.tsx` — redirect if logged in
9. Login / Register / Reset pages with react-hook-form + zod. Google OAuth + email/password.
10. `src/hooks/use-auth-forms.ts` — `useLoginForm`, `useRegisterForm` (with immediate `setUser` on registration), `useResetForm`

### Phase 2 — App Shell & Navigation
1. `src/components/layout/AppShell.tsx` — route guard, loading spinner
2. `src/components/layout/AppSidebar.tsx` — gold brand colors, nav: Dashboard / Players / Teams / Cards / Studio / Print / Achievements / Settings
3. `src/components/layout/AppBottomNav.tsx` — mobile 5-item nav
4. `src/components/layout/AppTopbar.tsx` — search, theme toggle, avatar dropdown, mini XP bar
5. `src/components/layout/PublicHeader.tsx` — glassmorphism, gold gradient logo
6. `src/app/[locale]/(protected)/layout.tsx` — wraps AppShell
7. Landing page `src/app/[locale]/page.tsx` — hero, feature grid, pricing section
8. Dashboard `src/app/[locale]/(protected)/page.tsx` — recent cards, quick create, XP progress, recent matches

### Phase 3 — Player Profiles
1. Full `Player` interface + player CRUD in `firebaseServices.ts` + player state in `appStore`
2. `PlayerCard.tsx`, `PlayerForm.tsx`, `PhotoUpload.tsx` (Firebase Storage upload)
3. Pages: `/players`, `/players/new`, `/players/[playerId]`
4. Public page `/player/[slug]` — bio, career stats, public card grid
5. Slug generation on `createPlayer` (unique, URL-safe)
6. Firestore rules for `users/{uid}/players`

### Phase 4 — Teams & Matches
1. Full `Team`, `Match`, `PlayerMatchStats` interfaces + CRUD in `firebaseServices.ts`
2. `TeamForm.tsx`, `TeamCard.tsx`, `TeamRoster.tsx`
3. `InvitePanel.tsx` — QR code (`qrcode.react`) + copy link + email invite
4. `MatchForm.tsx` — date picker, opponent, venue, result
5. `StatsEntryForm.tsx` — per-position stat grid (different fields for goalkeeper/defender/midfielder/forward)
6. Pages: `/teams`, `/teams/new`, `/teams/[teamId]`, `/teams/[teamId]/matches/*`
7. `src/hooks/use-aggregate-stats.ts` — computes career stats from all match stat docs
8. Firestore rules for `teams` + `matches` collections, composite indexes

### Phase 5 — Card Templates & Generator
Install: `konva react-konva html-to-image jspdf`

1. Full `Card`, `Template`, `CardType`, `Rarity`, `CardStats` interfaces + CRUD
2. `CardPreview.tsx` — lightweight read-only display (no Konva, uses `imageUrl` or CSS approximation)
3. `RarityBadge.tsx` — colored pill using `--rarity-*` tokens
4. `CardGeneratorWizard.tsx` — 5-step wizard: select player → card type → template → configure content → preview + generate
5. `src/lib/cardEngine.ts` — `computeDefaultRarity()`, `buildCardStats()`, `generateShareSlug()`, `canGenerateCard()`
6. Pages: `/cards/new`, `/cards/[cardId]`
7. `scripts/seed-templates.ts` — seed 3–5 free templates in Firestore
8. Firestore rules + indexes for `cards` + `templates`

### Phase 6 — Card Editor
1. `CardEditorCanvas.tsx` — Konva stage (420×588), layers: Background→Template→Photo→Stats→Text→Effects→Overlay, `useEffect` init, imperative updates
2. `EditorToolbar.tsx` — Content | Design | Effects tabs
3. `ContentPanel.tsx`, `DesignPanel.tsx`, `EffectsPanel.tsx` (toggles: gold foil, hologram, neon, LED, fire)
4. `src/hooks/use-card-editor.ts` — editor state, dirty flag, save handler, export handler
5. `src/lib/konvaEffects.ts` — Konva Filter setup for each effect
6. `src/lib/cardExport.ts` — `exportCardPNG(stage)` → `stage.toBlob({ pixelRatio: 3 })` → Firebase Storage upload → update `card.imageUrl`
7. `/cards/[cardId]/edit` page

### Phase 7 — Collections & Rarity
1. `/cards` collection browser with filter chips (season, card type, rarity)
2. `CollectionGrid.tsx` — responsive grid, `IntersectionObserver` lazy load, pagination (24 per page)
3. `CollectionFilters.tsx`, `SeasonAlbum.tsx`
4. `use-collection.ts` hook — load/filter/sort from appStore
5. Rarity auto-assignment logic in `cardEngine.ts` (rating 10 → Legendary, goals > 3 → Epic, MVP → Rare minimum)
6. `CardHologramEffect.tsx` — CSS animated gradient for Mythic cards

### Phase 8 — Achievements & XP
1. `Achievement`, `UserAchievement` interfaces + service functions
2. `src/lib/achievementEngine.ts` — `checkAchievements(stats, existing)` → array of newly unlocked IDs
3. `src/lib/xpEngine.ts` — `addXP()`, `getLevelFromXP()`, `getXPToNextLevel()`, `getUnlockables(level)`
4. `AchievementCard.tsx`, `XPBar.tsx`, `LevelBadge.tsx` (bronze 1–25, silver 26–50, gold 51–75, diamond 76–100)
5. `/achievements` page — gallery by category, XP history
6. `scripts/seed-achievements.ts` — seed all achievement definitions

### Phase 9 — AI Studio
**Cloud Functions** (`functions/src/index.ts`):
- `removeBackground` — Replicate `lucataco/remove-bg`
- `enhanceFace` — Replicate face enhancement model
- `generateActionPose` — Replicate SDXL + pose prompt
- `generateStadium` — Replicate SDXL + stadium prompt
- `generateCardStory` — OpenAI GPT-4o-mini, Czech system prompt
- `applyAIStyle` — Replicate SDXL + style LoRA (7 presets), writes to `cards/{cardId}.imageUrl`, updates `aiStatus`

**Client UI**:
- `/studio` hub with 7 feature tiles
- `BackgroundRemover.tsx`, `StyleTransferPanel.tsx`
- `use-ai-generation.ts` — call Cloud Function → `onSnapshot` poll on `aiStatus` → timeout/retry
- `AIProgressIndicator.tsx` — animated progress during generation

### Phase 10 — Social & Sharing
1. `/card/[shareSlug]` public viewer — card image, player name, stats, share buttons, QR code
2. `ShareButtons.tsx` — Instagram (download), Facebook, WhatsApp, Messenger, TikTok, copy link
3. `QRCodePanel.tsx` — `qrcode.react` + download
4. `use-share.ts` — Web Share API with platform-specific URL fallbacks
5. Increment `card.shareCount` on each share
6. Update `/player/[slug]` to show public card grid + career stats + achievement badges

### Phase 11 — Print Center
1. `src/lib/printEngine.ts`:
   - `exportCardPDF(imageUrl, format: "A4"|"A5")`
   - `exportStickerSheet(imageUrls, layout: "9up"|"12up")`
   - `exportAlbumPDF(cards, playerName, season)` — season cover + card pages
   - `exportTeamPack(teamCards)`
2. `/print` page with format selector, card multi-selector, print preview
3. Increment `card.printCount` after PDF generation

### Phase 12 — Subscription & Monetization Gating
1. `src/lib/subscriptionEngine.ts` — `canGenerateCard()`, `canUseAIStyle()`, `canExportHD()`, `canAccessTemplate()`
2. `UpgradeDialog.tsx` — shown on gated feature access
3. `/settings/subscription` page — current tier, monthly usage, upgrade CTA
4. `use-subscription.ts` — reads tier from `authStore`, returns gate functions
5. Gate: AI Studio, HD export, premium templates, Team/Club features

### Phase 13 — Club Mode
1. `Club` interface + CRUD in `firebaseServices.ts`
2. `ClubForm.tsx`, `ClubBrandingEditor.tsx`
3. Pages: `/clubs`, `/clubs/[clubId]`, `/clubs/[clubId]/teams`, `/clubs/[clubId]/templates`
4. Club custom templates stored in `templates/` with `clubId` field
5. Club branding: logo + primary color injected as scoped CSS variables

### Phase 14 — Admin Panel
1. `/admin` route group — Super Admin only gate
2. Admin dashboard: user count, card count, active teams, revenue metrics
3. User management, template management, content moderation queue, AI prompt editor (Remote Config)

### Phase 15 — PWA & Polish
1. `public/manifest.json` — name "Fotbalové Kartičky", theme_color `#C9960C`, display standalone, start_url `/cs/dashboard`
2. `public/sw.js` — cache shell + card images
3. FCM: `requestNotificationPermission()`, store token in `users/{uid}.fcmToken`
4. `PWAInstallBanner.tsx` — show after first card creation
5. Framer Motion page transitions: `AnimatePresence` + `motion.div` on all page layouts
6. Card reveal animation on new card generation
7. Card flip on collection grid hover
8. `loading="lazy"` + `IntersectionObserver` on all card images

### Phase 16 — Production Hardening
1. Complete `firestore.rules` (all collections)
2. `firestore.indexes.json` — all composite indexes
3. `firebase.json` — Firestore + Functions + Hosting config
4. `scripts/validate-env.ts` — fail-fast on missing vars
5. `src/components/ErrorBoundary.tsx`
6. Internationalise all remaining hardcoded strings
7. `npm run build` — fix all TypeScript strict errors
8. ESLint clean pass
9. `firebase deploy --only firestore:rules,firestore:indexes,functions,hosting`

---

## Critical Files (implement in this order)

1. `src/app/globals.css` — gold palette tokens (all other styles depend on this)
2. `src/types/index.ts` — all interfaces (all services + stores + components depend on this)
3. `src/lib/firebaseServices.ts` — all Firestore CRUD (no Firestore imports elsewhere)
4. `src/components/editor/CardEditorCanvas.tsx` — most architecturally complex component
5. `src/lib/cardEngine.ts` — pure business logic (rarity, XP, limits, export pipeline)

---

## Verification

After Phase 0:
- `npm run dev` starts without errors at `localhost:3000`
- Landing page renders with gold gradient brand color
- Dark mode toggle switches palette correctly

After Phase 1–2:
- Register → logged in → redirected to `/cs/dashboard` with no auth flicker
- Google OAuth login works
- AppSidebar visible on desktop, BottomNav on mobile

After Phase 5–6:
- Create a card end-to-end: select player → choose template → configure → generate → view in editor → export PNG → stored in Firebase Storage

After Phase 9:
- AI Studio: upload photo → remove background → see result
- Style transfer: select FIFA style → watch `aiStatus` progress → final image rendered on card

After Phase 11:
- Download a single A4 card PDF
- Download a 9-up sticker sheet PDF

After Phase 16:
- `firebase deploy` succeeds
- All Firestore rules enforced (test with Firebase Emulator)
- No TypeScript errors in strict mode
