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
  aiCreditsUsedThisMonth: number;
  fcmToken?: string;
  clubId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  dateOfBirth?: string;
  photoURL?: string;
  teamId?: string;
  clubId?: string;
  isPublic: boolean;
  careerStats: CareerStats;
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
  cardType: CardType;
  rarity: Rarity;
  templateId: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  shareSlug: string;
  isPublic: boolean;
  aiStyle?: AIStyle;
  aiStatus: AIStatus;
  aiJobId?: string;
  effect: CardEffect;
  cardStats: CardStats;
  season?: string;
  matchId?: string;
  shareCount: number;
  printCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
