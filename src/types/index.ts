import type { Timestamp } from "firebase/firestore";

// ─── Union types ─────────────────────────────────────────────────────────────

export type UserRole =
  | "guest"
  | "player"
  | "parent"
  | "coach"
  | "clubAdmin"
  | "superAdmin";

export type CardType =
  | "match"
  | "mvp"
  | "season"
  | "achievement"
  | "team"
  | "tournament"
  | "birthday"
  | "farewell"
  | "champion"
  | "rookie";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "limited";

export type AIStyle =
  | "fifa"
  | "panini"
  | "comic"
  | "anime"
  | "cartoon"
  | "fantasy"
  | "superhero";

export type PlayerPosition =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward";

export type SubscriptionTier = "free" | "premium" | "team" | "club";

export type AIStatus = "pending" | "processing" | "done" | "error";

export type CardEffect = "none" | "goldFoil" | "hologram" | "neon" | "led" | "fire";

export type MatchResult = "win" | "draw" | "loss";

export type LevelTier = "bronze" | "silver" | "gold" | "diamond";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  xp: number;
  level: number;
  cardsGeneratedThisMonth: number;
  cardsMonth?: string; // "YYYY-MM" the card counter belongs to
  aiCreditsUsedThisMonth: number;
  aiCreditsMonth?: string; // "YYYY-MM" the counter belongs to; set by Cloud Functions
  fcmToken?: string;
  clubId?: string;
  consents?: UserConsents;
  stripeCustomerId?: string; // written by Cloud Functions
  subscription?: UserSubscription; // mirrored from Stripe by the webhook
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BillingInterval = "month" | "year";

export interface UserSubscription {
  id: string;
  /** Stripe status: active | trialing | past_due | canceled | unpaid | incomplete | … */
  status: string;
  tier: SubscriptionTier | null;
  interval: BillingInterval | null;
  priceId: string | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
}

/** Who confirmed the account: a user aged 15+ (Czech age of digital consent) or a parent/guardian. */
export type AgeConfirmation = "15plus" | "guardian";

export interface UserConsents {
  /** LEGAL_VERSION (src/lib/legal.ts) of the terms + privacy policy the user accepted. */
  termsVersion: string;
  termsAcceptedAt: Timestamp;
  age: AgeConfirmation;
  /** Consent to sending photos to AI services; Cloud Functions refuse AI jobs without it. */
  aiPhotosAt?: Timestamp;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface CareerStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  saves: number;
  mvpCount: number;
}

export interface Player {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  position: PlayerPosition;
  jerseyNumber?: number;
  nationality?: string; // country code from components/card/Flag.tsx (e.g. "CZ"); cards default to CZ
  dateOfBirth?: string;
  photoURL?: string;
  teamId?: string;
  clubId?: string;
  isPublic: boolean;
  careerStats: CareerStats;
  progress?: { level: number; achievementIds: string[] }; // mirrored by syncProgress
  moderation?: ModerationInfo; // written only by Cloud Functions
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  coachId: string;
  clubId?: string;
  logoURL?: string;
  primaryColor?: string;
  season: string;
  ageGroup?: string;
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  teamId: string;
  date: string;
  opponent: string;
  venue?: string;
  homeScore: number;
  awayScore: number;
  isHome: boolean;
  result: MatchResult;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Player match stats ───────────────────────────────────────────────────────

export interface PlayerMatchStats {
  id: string;
  matchId: string;
  playerId: string;
  userId: string;
  position: PlayerPosition;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheet?: boolean;
  saves?: number;
  rating: number;
  isMVP: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardStats {
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  overall: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  saves?: number;
  rating?: number;
}

export interface Card {
  id: string;
  userId: string;
  playerId: string;
  playerName?: string; // snapshot for viewers who can't read a private player doc
  nationality?: string; // snapshot of the player's country for the flag on the card
  team?: CardTeam; // snapshot of the player's team for the crest on the card
  badges?: CardBadges; // flag/crest visibility + placement; absent = shown in the layout's default spot
  cardType: CardType;
  rarity: Rarity;
  templateId: string;
  templateStyle?: string; // legacy: template category on cards created before `design`
  photoUrl?: string; // card-specific photo (AI output); falls back to the player's photo
  backgroundUrl?: string; // AI stadium drawn behind the photo (best with a background-removed photo)
  photoVersions?: PhotoVersion[]; // AI photo history, written by Cloud Functions; [0] = original
  photoCutout?: boolean; // current photo has a transparent background (stadium shows behind it)
  design?: CardDesign; // full look; absent on older cards (see resolveDesign in lib/cardDesign.ts)
  imageUrl?: string; // full rendered card exported from the editor (download/share)
  thumbnailUrl?: string;
  shareSlug: string;
  isPublic: boolean;
  aiStyle?: AIStyle;
  aiStory?: string;
  aiStatus: AIStatus;
  aiJobId?: string;
  effect: CardEffect;
  cardStats: CardStats;
  season?: string;
  matchId?: string;
  shareCount: number;
  printCount: number;
  moderation?: ModerationInfo; // written only by Cloud Functions
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export type ReportReason = "inappropriate" | "noConsent" | "bullying" | "other";
export type ReportTargetType = "card" | "player";

/** Set on a card/player hidden by moderation: it can't be made public again by the owner. */
export interface ModerationInfo {
  hidden: boolean;
  by: "auto" | "admin";
  reason?: ReportReason;
  at: Timestamp;
}

/** One doc per reported card/player (`reports/{type}_{ownerId}_{id}`), written by Cloud Functions. */
export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  ownerId: string;
  title: string; // player name at report time
  link: string; // public path, e.g. /card/abc123
  status: "open" | "hidden" | "removed" | "dismissed"; // hidden = auto-hidden, awaiting review
  count: number; // distinct reporters since the last decision
  reasons: Partial<Record<ReportReason, number>>;
  notes: string[]; // latest reporter notes (max 10)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BadgePlacementId = "bottom" | "rating" | "topRight" | "photo";
export type FlagShapeId = "rect" | "rounded" | "circle" | "square" | "shield" | "hexagon" | "wave" | "pennant";

/** Whether and where the card shows the nationality flag and the club crest. */
export interface CardBadges {
  flag: boolean;
  crest: boolean;
  placement: BadgePlacementId;
  flagShape?: FlagShapeId;
}

export interface CardTeam {
  name: string;
  logoUrl?: string;
  color?: string; // hex; crest colour when there is no logo
}

export interface PhotoVersion {
  url: string;
  label: string; // e.g. "Originál", "Bez pozadí", "Oslava gólu"
  at: number; // epoch ms
  cutout?: boolean; // transparent background
}

// ─── Card design (see lib/cardDesign.ts for the catalogue) ────────────────────

export type ShapeId = "classic" | "elite" | "shard" | "bevel" | "fut" | "crown" | "pillar" | "torn";
export type FrameId =
  | "gold"
  | "silver"
  | "bronze"
  | "chrome"
  | "black"
  | "neon"
  | "ice"
  | "rosegold"
  | "team"
  | "line"
  | "doublegold"
  | "doublesilver"
  | "neonline"
  | "paper";
export type LayoutId = "fc" | "classic" | "pro" | "sticker" | "fullbleed" | "sidebar" | "minimal";
/** Face background. */
export type PatternId =
  | "clean"
  | "mesh"
  | "beams"
  | "facets"
  | "number"
  | "lava"
  | "spiral"
  | "smoke"
  | "marble"
  | "ribbons"
  | "streaks"
  | "crystal"
  | "neonburst"
  | "swirl"
  | "flames"
  | "grunge"
  | "cosmos"
  | "explosion";
export type FinishId = "none" | "gloss" | "refractor" | "prizm" | "shimmer" | "goldglint" | "speckle";
/** Light/smoke that spills outside the card on screen (not printed). */
export type AuraId = "none" | "glow" | "smoke" | "fire";
export type PhotoFilterId = "none" | "mono" | "warm" | "duo";
export type NameStyleId = "block" | "signature" | "outline";

export interface CardDesign {
  shape: ShapeId;
  frame: FrameId;
  layout: LayoutId;
  palette: string; // PALETTES key, or "custom" (uses customColors)
  customColors?: { primary: string; secondary: string }; // hex, e.g. club colours
  pattern: PatternId;
  finish: FinishId;
  /** Player breaks out of the photo window (needs a background-removed photo). */
  popOut?: boolean;
  aura?: AuraId;
  photoFilter?: PhotoFilterId;
  nameStyle?: NameStyleId;
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  nameCs: string;
  previewURL: string;
  category: string;
  rarityRange: Rarity[];
  requiredTier: SubscriptionTier;
  clubId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Achievement ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  key: string;
  nameCs: string;
  nameEn: string;
  descriptionCs: string;
  descriptionEn: string;
  category: string;
  xpReward: number;
  rarity: Rarity;
  iconName: string;
  triggerMetric: string;
  triggerThreshold: number;
  cardType?: CardType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Club ─────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  ownerId: string;
  logoURL?: string;
  primaryColor?: string;
  website?: string;
  city?: string;
  teamIds: string[];
  memberCount: number;
  subscriptionTier: SubscriptionTier;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
