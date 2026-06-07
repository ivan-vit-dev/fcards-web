import { create } from "zustand";
import type { Player, Team, Match, Card, Achievement } from "@/types";

// ─── Players ──────────────────────────────────────────────────────────────────

interface PlayersState {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  removePlayer: (id: string) => void;
}

export const usePlayersStore = create<PlayersState>((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((s) => ({ players: [...s.players, player] })),
  updatePlayer: (id, data) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  removePlayer: (id) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
}));

// ─── Teams ────────────────────────────────────────────────────────────────────

interface TeamsState {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  removeTeam: (id: string) => void;
}

export const useTeamsStore = create<TeamsState>((set) => ({
  teams: [],
  setTeams: (teams) => set({ teams }),
  addTeam: (team) => set((s) => ({ teams: [...s.teams, team] })),
  updateTeam: (id, data) =>
    set((s) => ({
      teams: s.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTeam: (id) =>
    set((s) => ({ teams: s.teams.filter((t) => t.id !== id) })),
}));

// ─── Matches ──────────────────────────────────────────────────────────────────

interface MatchesState {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  updateMatch: (id: string, data: Partial<Match>) => void;
  removeMatch: (id: string) => void;
}

export const useMatchesStore = create<MatchesState>((set) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),
  addMatch: (match) => set((s) => ({ matches: [...s.matches, match] })),
  updateMatch: (id, data) =>
    set((s) => ({
      matches: s.matches.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),
  removeMatch: (id) =>
    set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),
}));

// ─── Cards ────────────────────────────────────────────────────────────────────

interface CardsState {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (id: string, data: Partial<Card>) => void;
  removeCard: (id: string) => void;
}

export const useCardsStore = create<CardsState>((set) => ({
  cards: [],
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((s) => ({ cards: [...s.cards, card] })),
  updateCard: (id, data) =>
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeCard: (id) =>
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
}));

// ─── Achievements ─────────────────────────────────────────────────────────────

interface AchievementsState {
  achievements: Achievement[];
  unlockedIds: string[];
  setAchievements: (achievements: Achievement[]) => void;
  setUnlockedIds: (ids: string[]) => void;
  addUnlockedId: (id: string) => void;
}

export const useAchievementsStore = create<AchievementsState>((set) => ({
  achievements: [],
  unlockedIds: [],
  setAchievements: (achievements) => set({ achievements }),
  setUnlockedIds: (ids) => set({ unlockedIds: ids }),
  addUnlockedId: (id) =>
    set((s) => ({ unlockedIds: [...s.unlockedIds, id] })),
}));
