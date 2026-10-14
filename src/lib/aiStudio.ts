// AI Studio options shown in the UI. Ids must match EDIT_OPTIONS / STADIUM_PROMPTS in
// functions/src/index.ts — the prompts themselves live only on the server.

export type EditKind = "pose" | "emotion" | "style";

export interface StudioOption {
  id: string;
  label: string;
  emoji: string;
  premium: boolean;
}

export const POSE_OPTIONS: StudioOption[] = [
  { id: "celebrate", label: "Oslava gólu", emoji: "🙌", premium: true },
  { id: "fist", label: "Vítězná pěst", emoji: "✊", premium: true },
  { id: "arms_crossed", label: "Založené ruce", emoji: "💪", premium: true },
  { id: "thumbs_up", label: "Palec nahoru", emoji: "👍", premium: true },
  { id: "point", label: "Ukazuje na tebe", emoji: "👉", premium: true },
  { id: "heart", label: "Srdíčko", emoji: "🫶", premium: true },
  { id: "ball", label: "Míč v ruce", emoji: "⚽", premium: true },
  { id: "trophy", label: "S pohárem", emoji: "🏆", premium: true },
  { id: "kick", label: "Kop do míče", emoji: "🦵", premium: true },
];

export const EMOTION_OPTIONS: StudioOption[] = [
  { id: "smile", label: "Úsměv", emoji: "😄", premium: true },
  { id: "focused", label: "Odhodlání", emoji: "😤", premium: true },
  { id: "joy", label: "Radost z gólu", emoji: "🤩", premium: true },
  { id: "cool", label: "V pohodě", emoji: "😎", premium: true },
  { id: "wink", label: "Mrknutí", emoji: "😉", premium: true },
];

export const STYLE_OPTIONS: StudioOption[] = [
  { id: "fifa", label: "Herní karta", emoji: "🎮", premium: false },
  { id: "panini", label: "Retro 90. léta", emoji: "📼", premium: false },
  { id: "comic", label: "Komiks", emoji: "💥", premium: false },
  { id: "anime", label: "Anime", emoji: "✨", premium: true },
  { id: "cartoon", label: "3D animák", emoji: "🧸", premium: true },
  { id: "fantasy", label: "Malba", emoji: "🎨", premium: true },
  { id: "superhero", label: "Superhrdina", emoji: "🦸", premium: true },
];

export const STADIUM_OPTIONS: StudioOption[] = [
  { id: "night", label: "Noční zápas", emoji: "🌙", premium: true },
  { id: "sunset", label: "Západ slunce", emoji: "🌇", premium: true },
  { id: "champions", label: "Liga mistrů", emoji: "⭐", premium: true },
  { id: "empty", label: "Dramatický", emoji: "🏟️", premium: true },
];
