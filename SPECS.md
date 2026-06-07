# Fotbalové Kartičky — Technical Specification

## 1. Product Overview

**Fotbalové Kartičky** (Football Cards Forge) is a Czech football trading card platform. Players, parents, coaches, and clubs use it to generate personalized collector cards from real match statistics and photos — with AI-powered styling, physical print export, and social sharing.

### Key differentiators
- **Career Timeline** — every card a player ever generates forms a visual career history
- **AI Studio** — background removal, action pose generation, stadium backgrounds, style transfer (FIFA, Panini, Comic, Anime, etc.)
- **Print-to-Physical** — A4/A5 cards, sticker sheets, full album PDFs, team packs
- **Digital Sticker Album** — Panini-style collection organized by season and team
- **Dynamic Match Hero Card** — auto-generated after each match for MVP or top performers

---

## 2. User Roles & Permissions Matrix

| Capability | Guest | Player | Parent | Coach | Club Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Browse public cards & profiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create account | ✓ | — | — | — | — | — |
| Create/edit player profile | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create cards | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Share cards | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Print/export cards | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/manage team | — | — | — | ✓ | ✓ | ✓ |
| Invite team members | — | — | — | ✓ | ✓ | ✓ |
| Log match results & stats | — | — | — | ✓ | ✓ | ✓ |
| AI Studio features | — | premium | premium | premium | ✓ | ✓ |
| Manage club (multiple teams) | — | — | — | — | ✓ | ✓ |
| Custom club templates | — | — | — | — | ✓ | ✓ |
| Manage all users | — | — | — | — | — | ✓ |
| Content moderation | — | — | — | — | — | ✓ |
| Edit AI prompts (Remote Config) | — | — | — | — | — | ✓ |

---

## 3. Subscription Tiers

| Feature | Free | Premium | Team | Club |
|---|---|---|---|---|
| Cards per month | 20 | Unlimited | Unlimited | Unlimited |
| AI credits per month | 0 | 50 | 200 | 1000 |
| AI style transfer | — | ✓ | ✓ | ✓ |
| AI background removal | — | ✓ | ✓ | ✓ |
| HD export (3× pixel ratio) | — | ✓ | ✓ | ✓ |
| Basic templates | ✓ | ✓ | ✓ | ✓ |
| Premium templates | — | ✓ | ✓ | ✓ |
| Team templates | — | — | ✓ | ✓ |
| Club custom templates | — | — | — | ✓ |
| Storage (photos) | 500 MB | 5 GB | 20 GB | 100 GB |
| Teams | 1 | 3 | Unlimited | Unlimited |
| Players per team | 25 | 50 | Unlimited | Unlimited |

---

## 4. Complete Data Model

All interfaces below are the authoritative source for `src/types/index.ts`.

### Union types

```ts
type UserRole        = "guest" | "player" | "parent" | "coach" | "clubAdmin" | "superAdmin";
type SubscriptionTier = "free" | "premium" | "team" | "club";
type PlayerPosition  = "goalkeeper" | "defender" | "midfielder" | "forward";
type CardType        = "match" | "mvp" | "season" | "achievement" | "team" | "tournament" | "birthday" | "farewell" | "champion" | "rookie";
type Rarity          = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "limited";
type AIStyle         = "fifa" | "panini" | "comic" | "anime" | "cartoon" | "fantasy" | "superhero";
type AIStatus        = "none" | "pending" | "processing" | "done" | "error";
type MatchStatus     = "scheduled" | "completed" | "cancelled";
type CardEffect      = "goldFoil" | "hologram" | "neon" | "led" | "fire";
type LevelTier       = "bronze" | "silver" | "gold" | "diamond";
```

### `users/{uid}`

```ts
interface User {
  uid:                  string;
  email:                string;
  displayName:          string;
  photoURL:             string | null;
  role:                 UserRole;
  subscriptionTier:     SubscriptionTier;
  subscriptionExpiresAt: Timestamp | null;
  fcmToken:             string | null;
  xp:                   number;
  level:                number;           // cached, derived from xp
  monthlyCardCount:     number;           // resets on 1st of month
  monthlyAICredits:     number;           // resets on 1st of month
  createdAt:            Timestamp;
  updatedAt:            Timestamp;
}
```

### `users/{uid}/players/{playerId}`

```ts
interface Player {
  id:            string;
  userId:        string;                 // owner
  firstName:     string;
  lastName:      string;
  displayName:   string;
  slug:          string;                 // URL-safe unique: "tomas-novak-u11"
  photoURL:      string | null;
  position:      PlayerPosition;
  jerseyNumber:  number | null;
  birthYear:     number | null;
  favoriteClub:  string | null;
  favoritePlayer: string | null;
  teamIds:       string[];
  careerStats:   PlayerCareerStats;      // aggregated, updated on match stat save
  xp:            number;
  createdAt:     Timestamp;
  updatedAt:     Timestamp;
}

interface PlayerCareerStats {
  matches:      number;
  goals:        number;
  assists:      number;
  cleanSheets:  number;
  saves:        number;
  mvpCount:     number;
  rating:       number;                  // average
}
```

### `teams/{teamId}`

```ts
interface Team {
  id:           string;
  name:         string;
  logoURL:      string | null;
  season:       string;                  // "2024/2025"
  ageCategory:  string;                  // "U11", "U12", etc.
  clubId:       string | null;
  coachId:      string;                  // owner
  memberUids:   string[];
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
}
```

### `matches/{matchId}`

```ts
interface Match {
  id:           string;
  teamId:       string;
  opponent:     string;
  date:         Timestamp;
  venue:        string | null;
  homeScore:    number | null;
  awayScore:    number | null;
  isHome:       boolean;
  status:       MatchStatus;
  mvpPlayerId:  string | null;
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
}
```

### `matches/{matchId}/playerStats/{playerId}`

```ts
interface PlayerMatchStats {
  playerId:         string;
  minutesPlayed:    number;
  goals:            number;
  assists:          number;
  shots:            number;
  passesCompleted:  number;
  chancesCreated:   number;
  tackles:          number;
  blocks:           number;
  saves:            number;
  cleanSheet:       boolean;
  rating:           number | null;       // 1–10, set by coach
  isMVP:            boolean;
  isCapitain:       boolean;
}
```

### `cards/{cardId}`

```ts
interface Card {
  id:           string;
  playerId:     string;
  userId:       string;                  // card owner
  templateId:   string;
  cardType:     CardType;
  rarity:       Rarity;
  imageUrl:     string | null;           // full-quality PNG in Storage
  thumbnailUrl: string | null;           // collection grid thumbnail
  aiStatus:     AIStatus;
  aiStyle:      AIStyle | null;
  effects:      CardEffect[];
  isPublic:     boolean;
  shareSlug:    string;                  // short unique ID for /card/[slug]
  seasonLabel:  string | null;           // "2024/2025"
  teamName:     string | null;
  statsSnapshot: CardStatsSnapshot;      // frozen stats at time of card creation
  printCount:   number;
  shareCount:   number;
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
}

interface CardStatsSnapshot {
  goals?:      number;
  assists?:    number;
  rating?:     number;
  saves?:      number;
  cleanSheet?: boolean;
  isMVP?:      boolean;
  matchDate?:  string;
  opponent?:   string;
}
```

### `templates/{templateId}`

```ts
interface Template {
  id:         string;
  name:       string;
  nameCs:     string;
  category:   CardType;
  minRarity:  Rarity;                    // minimum rarity required for this template
  previewUrl: string;
  tier:       SubscriptionTier;          // minimum subscription tier
  clubId:     string | null;             // null = global template
  isActive:   boolean;
  config:     TemplateConfig;
  createdAt:  Timestamp;
  updatedAt:  Timestamp;
}

interface TemplateConfig {
  layers: TemplateLayer[];
  defaultBackground: string;             // CSS color or gradient name
  fontScale: number;                     // 1.0 = default
}

interface TemplateLayer {
  id:       string;
  type:     "background" | "frame" | "photo" | "stats" | "name" | "badge";
  zIndex:   number;
  x:        number;
  y:        number;
  width:    number;
  height:   number;
  locked:   boolean;
}
```

### `achievements/{achievementId}`

```ts
interface Achievement {
  id:            string;
  key:           string;                 // "goal_machine_100"
  nameCs:        string;
  nameEn:        string;
  descriptionCs: string;
  descriptionEn: string;
  icon:          string;                 // lucide-react icon name
  xpReward:      number;
  cardType:      CardType;               // card generated on unlock
  cardRarity:    Rarity;
  condition:     AchievementCondition;
}

interface AchievementCondition {
  metric:    keyof PlayerCareerStats | "captainMatches";
  threshold: number;
}
```

### `userAchievements/{uid}/{achievementId}`

```ts
interface UserAchievement {
  achievementId: string;
  unlockedAt:    Timestamp;
  cardId:        string | null;          // achievement card generated on unlock
}
```

### `clubs/{clubId}`

```ts
interface Club {
  id:           string;
  name:         string;
  logoURL:      string | null;
  ownerId:      string;                  // Club Admin uid
  teamIds:      string[];
  brandingConfig: ClubBrandingConfig;
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
}

interface ClubBrandingConfig {
  primaryColor:   string | null;         // oklch() value
  accentColor:    string | null;
  logoPosition:   "top-left" | "top-right" | "bottom-left" | "bottom-right";
}
```

---

## 5. Rarity System

| Rarity | Czech | CSS token | Visual treatment | How awarded |
|---|---|---|---|---|
| Common | Běžná | `--rarity-common` | Grey | Default for all new cards |
| Uncommon | Neobvyklá | `--rarity-uncommon` | Green | rating ≥ 6 or 2+ goals |
| Rare | Vzácná | `--rarity-rare` | Blue | MVP, rating ≥ 8, or 3+ goals |
| Epic | Epická | `--rarity-epic` | Purple | rating 9–9.9, hat-trick, or clean sheet + 10 saves |
| Legendary | Legendární | `--rarity-legendary` | Gold (= primary) | rating 10, 4+ goals, or Season/Champion card |
| Mythic | Mýtická | animated holographic | Holographic gradient animation | Season finale, manually assigned by coach, or AI-generated |
| Limited | Limitovaná | `--rarity-limited` | Red-orange | Manually assigned, limited count set by coach |

**Auto-assignment logic** (`cardEngine.ts` → `computeDefaultRarity()`):
```ts
rating === 10          → legendary
goals >= 4             → legendary
rating >= 9            → epic
goals >= 3             → epic
isMVP                  → rare (minimum)
rating >= 8            → rare
goals >= 2 || rating >= 6 → uncommon
default                → common
```

---

## 6. XP & Leveling

### XP events

| Event | XP gained |
|---|---|
| Create a card | +50 |
| Share a card | +25 |
| Log match stats (as coach) | +100 |
| Receive MVP award | +200 |
| Unlock achievement | +varies (see Section 7) |
| Complete a season | +500 |
| Refer a friend (join via link) | +300 |
| First card ever created | +100 (bonus) |
| Card reaches 10 shares | +50 (one-time) |

### Level thresholds (selected)

| Level | Cumulative XP | Tier |
|---|---|---|
| 1 | 0 | Bronze |
| 5 | 1 000 | Bronze |
| 10 | 3 000 | Bronze |
| 25 | 15 000 | Bronze → Silver |
| 50 | 50 000 | Silver → Gold |
| 75 | 120 000 | Gold → Diamond |
| 100 | 250 000 | Diamond |

Formula for level N threshold: `XP(N) = floor(250 * N^1.6)`

### Unlocks by level

| Level | Unlocks |
|---|---|
| 5 | Frame: Bronze border |
| 10 | Effect: Neon |
| 15 | Template: Dark |
| 20 | Effect: Gold foil |
| 25 | Frame: Silver border |
| 30 | Template: Gradient |
| 40 | Effect: Hologram |
| 50 | Frame: Gold border |
| 60 | Effect: LED |
| 70 | Template: Premium |
| 75 | Frame: Diamond border |
| 80 | Effect: Fire |
| 100 | Frame: Mythic crown, Template: Legendary |

---

## 7. Achievement Specification

| Key | Czech name | Condition | XP | Card rarity | Icon |
|---|---|---|---|---|---|
| `goal_machine_25` | Střelec | 25 career goals | +100 | Common | `Target` |
| `goal_machine_100` | Střelecký stroj | 100 career goals | +500 | Legendary | `Trophy` |
| `iron_man_10` | Bojovník | 10 matches played | +75 | Common | `Shield` |
| `iron_man_50` | Železný muž | 50 matches played | +300 | Epic | `Shield` |
| `iron_man_100` | Legendární bojovník | 100 matches played | +800 | Legendary | `ShieldCheck` |
| `captain_10` | Kapitán | 10 matches as captain | +250 | Rare | `Star` |
| `playmaker_25` | Tvůrce hry | 25 assists | +150 | Uncommon | `Zap` |
| `playmaker_50` | Orchestrátor | 50 assists | +400 | Epic | `Zap` |
| `wall_10` | Zeď | 10 clean sheets (GK) | +200 | Rare | `Lock` |
| `wall_20` | Neprůstupná zeď | 20 clean sheets (GK) | +500 | Legendary | `Lock` |
| `hat_trick` | Hattrick | 3+ goals in one match | +200 | Epic | `Flame` |
| `mvp_5` | Hvězda | 5 MVP awards | +150 | Rare | `Award` |
| `mvp_20` | Superhvězda | 20 MVP awards | +600 | Legendary | `Award` |
| `first_card` | První kartička | Created first card | +100 | Common | `CreditCard` |
| `social_butterfly` | Sdílení je péče | 10 cards shared | +100 | Uncommon | `Share2` |
| `collector_25` | Sběratel | 25 cards in collection | +150 | Rare | `Archive` |
| `collector_100` | Velký sběratel | 100 cards in collection | +500 | Legendary | `Archive` |
| `season_complete` | Sezóna splněna | Complete a full season | +500 | Epic | `Calendar` |
| `top_scorer` | Nejlepší střelec | Top scorer of a season | +300 | Epic | `Goal` |
| `perfect_rating` | Dokonalý | Rating 10/10 in a match | +250 | Legendary | `Sparkles` |

---

## 8. Card Generator Specification

| Card type | Trigger | Required data | Default rarity | Auto-generates |
|---|---|---|---|---|
| match | Manual after logging match stats | player, match, stats | Computed by `computeDefaultRarity()` | On MVP designation |
| mvp | `isMVP = true` on PlayerMatchStats | player, match, stats | Rare minimum | Yes — auto on MVP |
| season | End of season (manual or scheduled) | player, full season stats | Epic minimum | No |
| achievement | Achievement unlocked | player, achievement | Per achievement config | Yes — auto on unlock |
| team | Manual by coach | team, all players | Common | No |
| tournament | Manual after tournament | player/team, results | Epic minimum | No |
| birthday | Manual or scheduled on birthYear | player | Common | No |
| farewell | Manual — end of career at club | player, career stats | Legendary | No |
| champion | Tournament/season winner | player, trophy | Legendary | No |
| rookie | First match/season | player | Common | On first match stats |

---

## 9. AI Studio Specification

All AI features require Premium subscription (or higher) unless noted.

### `removeBackground`
- **Function**: `removeBackground`
- **Model**: Replicate `851-labs/background-removal`
- **Input**: `{ imageUrl: string }`
- **Output**: `{ resultUrl: string }`
- **Latency**: ~5–15 s
- **Credits**: 2 per use
- **Tier**: Premium+

### `enhanceFace`
- **Function**: `enhanceFace`
- **Model**: Replicate `tencentarc/gfpgan`
- **Input**: `{ imageUrl: string, scale: 2 | 4 }`
- **Output**: `{ resultUrl: string }`
- **Latency**: ~10–20 s
- **Credits**: 3 per use
- **Tier**: Premium+

### `generateActionPose`
- **Function**: `generateActionPose`
- **Model**: Replicate SDXL + ControlNet (openpose)
- **Input**: `{ imageUrl: string, position: PlayerPosition }`
- **Output**: `{ resultUrl: string }`
- **Latency**: ~30–60 s
- **Credits**: 8 per use
- **Tier**: Premium+

### `generateStadium`
- **Function**: `generateStadium`
- **Model**: Replicate `stability-ai/sdxl`
- **Input**: `{ timeOfDay: "day" | "night" | "evening", crowdDensity: "empty" | "half" | "full", weather: "clear" | "rainy" | "foggy" }`
- **Output**: `{ resultUrl: string }`
- **Latency**: ~20–40 s
- **Credits**: 5 per use
- **Tier**: Premium+

### `generateCardStory`
- **Function**: `generateCardStory`
- **Model**: OpenAI `gpt-4o-mini`
- **Input**: `{ playerName: string, cardType: CardType, stats: CardStatsSnapshot, locale: "cs" | "en" }`
- **Output**: `{ story: string }` — 1–3 sentences
- **Latency**: ~3–8 s
- **Credits**: 1 per use
- **Tier**: Premium+

### `applyAIStyle`
- **Function**: `applyAIStyle`
- **Model**: Replicate SDXL with style-specific LoRA/prompt
- **Input**: `{ imageUrl: string, style: AIStyle, cardId: string }`
- **Output**: updates `cards/{cardId}.aiStatus` and `cards/{cardId}.imageUrl` directly
- **Latency**: ~30–90 s
- **Credits**: 10 per use
- **Tier**: Premium+

Style prompts:
- `fifa` — photorealistic, FIFA Ultimate Team card style, dramatic lighting
- `panini` — Panini sticker style, bright saturated colors, classic border
- `comic` — comic book cel shading, bold outlines, halftone dots
- `anime` — anime art style, vibrant colors, smooth shading
- `cartoon` — cartoon character style, simplified features, bold colors
- `fantasy` — dark fantasy, mystical aura, glowing effects
- `superhero` — superhero comic style, dynamic pose emphasis, speed lines

---

## 10. Route Map

### Public routes
```
/[locale]/                              # Landing page
/[locale]/player/[slug]                 # Public player profile
/[locale]/card/[shareSlug]              # Public card viewer
/[locale]/auth/login                    # Login
/[locale]/auth/register                 # Register
/[locale]/auth/reset                    # Password reset
```

### Protected routes (require auth, rendered inside AppShell)
```
/[locale]/dashboard                     # Home: recent cards, XP, quick actions
/[locale]/profile                       # User account profile
/[locale]/players                       # Player list
/[locale]/players/new                   # Create player
/[locale]/players/[playerId]            # Player detail + edit
/[locale]/teams                         # Team list
/[locale]/teams/new                     # Create team
/[locale]/teams/[teamId]                # Team detail: roster, matches
/[locale]/teams/[teamId]/matches/new    # Log new match
/[locale]/teams/[teamId]/matches/[matchId]  # Match detail + stats
/[locale]/cards                         # Card collection browser
/[locale]/cards/new                     # Card generator wizard
/[locale]/cards/[cardId]                # Card detail view
/[locale]/cards/[cardId]/edit           # Full card editor
/[locale]/studio                        # AI Studio hub
/[locale]/print                         # Print center
/[locale]/achievements                  # Achievement gallery + XP history
/[locale]/settings                      # Account settings
/[locale]/settings/subscription         # Subscription management
/[locale]/clubs                         # Club list (Club Admin)
/[locale]/clubs/[clubId]                # Club management
```

### Admin routes (Super Admin only)
```
/[locale]/admin                         # Admin dashboard
/[locale]/admin/users                   # User management
/[locale]/admin/templates               # Template management
/[locale]/admin/moderation              # Content moderation queue
```

---

## 11. Cloud Functions API

All functions are HTTP-callable (`onCall`). Client calls via Firebase SDK's `httpsCallable`.

### `removeBackground`
```
Input:  { imageUrl: string }
Output: { resultUrl: string }
Auth:   required, subscriptionTier >= "premium"
Timeout: 120s
```

### `enhanceFace`
```
Input:  { imageUrl: string, scale: 2 | 4 }
Output: { resultUrl: string }
Auth:   required, subscriptionTier >= "premium"
Timeout: 120s
```

### `generateActionPose`
```
Input:  { imageUrl: string, position: PlayerPosition }
Output: { resultUrl: string }
Auth:   required, subscriptionTier >= "premium"
Timeout: 180s
```

### `generateStadium`
```
Input:  { timeOfDay: string, crowdDensity: string, weather: string }
Output: { resultUrl: string }
Auth:   required, subscriptionTier >= "premium"
Timeout: 120s
```

### `generateCardStory`
```
Input:  { playerName: string, cardType: CardType, stats: object, locale: "cs" | "en" }
Output: { story: string }
Auth:   required, subscriptionTier >= "premium"
Timeout: 30s
```

### `applyAIStyle`
```
Input:  { cardId: string, imageUrl: string, style: AIStyle }
Output: void (updates card doc directly)
Auth:   required, subscriptionTier >= "premium"
Timeout: 300s
Side effects: sets cards/{cardId}.aiStatus = "processing", then "done"/"error"
              sets cards/{cardId}.imageUrl on completion
```

### `triggerAchievementCheck`
```
Input:  { playerId: string, uid: string }
Output: { unlocked: string[] }   // achievement IDs newly unlocked
Auth:   required (self or coach)
Timeout: 30s
```

### `generateQRCode`
```
Input:  { url: string, size: number }
Output: { dataUrl: string }      // PNG data URL
Auth:   required
Timeout: 10s
```

---

## 12. Print Specification

| Format | Card size (mm) | Paper | Bleed | Cards per sheet | jsPDF page |
|---|---|---|---|---|---|
| A4 card | 63 × 88 | A4 (210×297) | 3 mm | 1 (centered) | `'a4', 'p', 'mm'` |
| A5 card | 63 × 88 | A5 (148×210) | 3 mm | 1 (centered) | `'a5', 'p', 'mm'` |
| Sticker 9-up | 63 × 88 | A4 | 1 mm | 9 (3×3) | `'a4', 'p', 'mm'` |
| Sticker 12-up | 63 × 88 | A4 | 1 mm | 12 (3×4) | `'a4', 'p', 'mm'` |
| Album PDF | 63 × 88 | A4 | — | 9 per page | Multi-page jsPDF |
| Team pack | 63 × 88 | A4 | 3 mm | 1 per page | Multi-page with cover |

Canvas export resolution: `pixelRatio: 3` from Konva → 1260 × 1764 px (300 DPI equivalent for 63 × 88 mm card).

---

## 13. Social Sharing Specification

### Instagram
- Action: download card image, open Instagram app
- Image size: 1080 × 1080 px (square crop from card) or 1080 × 1920 px (story)
- Caption template (cs): `⚽ {playerName} · {cardType} kartička · {rarity} #fotbalovekarticky #{clubName}`

### Facebook
- URL: `https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(cardUrl)}`

### WhatsApp
- URL: `https://wa.me/?text={encodeURIComponent(text + ' ' + cardUrl)}`

### Messenger
- URL: `fb-messenger://share?link={encodeURIComponent(cardUrl)}`

### TikTok
- Action: download card image, open TikTok app (no deep link API)
- Copy caption to clipboard automatically

### Generic / QR
- Show QR code for `/[locale]/card/[shareSlug]`
- Copy link button
- Web Share API (`navigator.share`) when available (mobile browsers)

---

## 14. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() { return request.auth != null; }
    function isOwner(uid) { return isAuth() && request.auth.uid == uid; }
    function isSuperAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superAdmin';
    }
    function isCoach(teamId) {
      return isAuth() && get(/databases/$(database)/documents/teams/$(teamId)).data.coachId == request.auth.uid;
    }
    function isTeamMember(teamId) {
      return isAuth() && request.auth.uid in get(/databases/$(database)/documents/teams/$(teamId)).data.memberUids;
    }

    match /users/{uid} {
      allow read:   if isOwner(uid) || isSuperAdmin();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid) || isSuperAdmin();
      allow delete: if isSuperAdmin();

      match /players/{playerId} {
        allow read:   if isOwner(uid) || isSuperAdmin();
        allow write:  if isOwner(uid) || isSuperAdmin();
      }
    }

    match /teams/{teamId} {
      allow read:   if isAuth() && (isCoach(teamId) || isTeamMember(teamId)) || isSuperAdmin();
      allow create: if isAuth();
      allow update: if isCoach(teamId) || isSuperAdmin();
      allow delete: if isCoach(teamId) || isSuperAdmin();

      match /members/{userId} {
        allow read:  if isCoach(teamId) || isTeamMember(teamId);
        allow write: if isCoach(teamId) || isSuperAdmin();
      }
    }

    match /matches/{matchId} {
      allow read:   if isAuth();
      allow create: if isAuth();
      allow update: if isAuth() && resource.data.teamId != null;
      allow delete: if isSuperAdmin();

      match /playerStats/{playerId} {
        allow read:  if isAuth();
        allow write: if isAuth();
      }
    }

    match /cards/{cardId} {
      allow read:  if resource.data.isPublic == true || (isAuth() && resource.data.userId == request.auth.uid) || isSuperAdmin();
      allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuth() && resource.data.userId == request.auth.uid || isSuperAdmin();
      allow delete: if isAuth() && resource.data.userId == request.auth.uid || isSuperAdmin();
    }

    match /templates/{templateId} {
      allow read:   if isAuth() || resource.data.isActive == true;
      allow write:  if isSuperAdmin();
    }

    match /achievements/{achievementId} {
      allow read:   if true;
      allow write:  if isSuperAdmin();
    }

    match /userAchievements/{uid}/{achievementId} {
      allow read:   if isOwner(uid) || isSuperAdmin();
      allow write:  if isSuperAdmin();                  // only Cloud Functions write here
    }

    match /clubs/{clubId} {
      allow read:   if isAuth();
      allow create: if isAuth();
      allow update: if isAuth() && resource.data.ownerId == request.auth.uid || isSuperAdmin();
      allow delete: if isSuperAdmin();
    }
  }
}
```

---

## 15. Firestore Indexes

Required composite indexes (`firestore.indexes.json`):

```json
{
  "indexes": [
    { "collectionGroup": "cards",   "fields": [{"fieldPath": "userId",   "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
    { "collectionGroup": "cards",   "fields": [{"fieldPath": "playerId", "order": "ASCENDING"}, {"fieldPath": "rarity",    "order": "ASCENDING"},   {"fieldPath": "createdAt", "order": "DESCENDING"}] },
    { "collectionGroup": "cards",   "fields": [{"fieldPath": "isPublic", "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
    { "collectionGroup": "cards",   "fields": [{"fieldPath": "playerId", "order": "ASCENDING"}, {"fieldPath": "cardType",  "order": "ASCENDING"},   {"fieldPath": "createdAt", "order": "DESCENDING"}] },
    { "collectionGroup": "teams",   "fields": [{"fieldPath": "coachId",  "order": "ASCENDING"}, {"fieldPath": "createdAt", "order": "DESCENDING"}] },
    { "collectionGroup": "matches", "fields": [{"fieldPath": "teamId",   "order": "ASCENDING"}, {"fieldPath": "date",      "order": "DESCENDING"}] }
  ]
}
```

---

## 16. Design System (Token Reference)

See `CLAUDE.md` → Color system section and `src/app/globals.css` for complete CSS variable definitions.

### Typography

| Usage | Classes |
|---|---|
| Page heading | `text-3xl font-bold sm:text-4xl lg:text-5xl font-display` |
| Section heading | `text-xl font-semibold` |
| Card player name | `text-lg font-bold font-display uppercase tracking-wide` |
| Body text | `text-sm` |
| Caption / meta | `text-xs text-muted-foreground` |
| Score / stat number | `text-2xl font-bold font-display tabular-nums` |

### Button variants (shadcn extensions)

| Variant | Usage | Class additions |
|---|---|---|
| `default` | Standard actions | `bg-primary text-primary-foreground` |
| `gradient-brand` | Primary CTAs | `gradient-brand text-primary-foreground hover:opacity-90` |
| `outline` | Secondary actions | Standard shadcn outline |
| `ghost` | Nav items, icon buttons | Standard shadcn ghost |
| `destructive` | Delete actions | Standard shadcn destructive |

### Card patterns

```
Generic card:    rounded-xl bg-card ring-1 ring-foreground/10
Trading card:    rounded-lg overflow-hidden aspect-[2.5/3.5]
Legendary card:  + shadow-card-legendary gradient-card-legendary
Mythic card:     + gradient-mythic (animated)
```

---

## 17. PWA Specification

### `public/manifest.json`
```json
{
  "name": "Fotbalové Kartičky",
  "short_name": "FKartičky",
  "description": "Tvoje fotbalová kolekce",
  "start_url": "/cs/dashboard",
  "display": "standalone",
  "background_color": "#1a150a",
  "theme_color": "#C9960C",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### FCM Push Topics
- `card_ready` — AI card generation completed
- `achievement_unlocked` — new achievement
- `team_invite` — team invitation received

### Offline strategy
- Service worker caches: shell (layout, fonts), static assets, last 50 card thumbnail images
- Card editor requires online (AI features, Konva export upload)
- Collection browse works offline from cache

### Install prompt
- Triggered after user creates their first card (`card.printCount === 0 && cardsCreated === 1`)
- Uses `beforeinstallprompt` event (PWAInstallBanner component)
