import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Rarity, LevelTier } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found": "Uživatel nenalezen.",
    "auth/wrong-password": "Nesprávné heslo.",
    "auth/email-already-in-use": "E-mail je již zaregistrován.",
    "auth/invalid-email": "Neplatná e-mailová adresa.",
    "auth/weak-password": "Heslo je příliš slabé (min. 6 znaků).",
    "auth/too-many-requests": "Příliš mnoho pokusů. Zkuste to znovu za chvíli.",
    "auth/network-request-failed": "Chyba sítě. Zkontrolujte připojení.",
    "auth/popup-closed-by-user": "Přihlášení bylo zrušeno.",
    "auth/invalid-credential": "Neplatné přihlašovací údaje.",
    "auth/account-exists-with-different-credential":
      "Účet s tímto e-mailem již existuje s jiným způsobem přihlášení.",
    "auth/unauthorized-domain":
      "Přihlášení přes Google není pro tuto adresu webu povolené (chybí v povolených doménách Firebase).",
    "auth/popup-blocked": "Prohlížeč zablokoval okno přihlášení. Povolte vyskakovací okna a zkuste to znovu.",
    "auth/cancelled-popup-request": "Přihlášení bylo přerušeno. Zkuste to znovu.",
    "auth/operation-not-supported-in-this-environment":
      "Tento prohlížeč přihlášení přes Google nepodporuje. Otevřete stránku v Chromu.",
    "auth/web-storage-unsupported":
      "Prohlížeč blokuje úložiště potřebné k přihlášení. Otevřete stránku v Chromu bez anonymního režimu.",
  };
  // Unknown codes keep the code visible so problems on users' devices can be diagnosed.
  return messages[code] ?? `Nastala neočekávaná chyba${code ? ` (${code})` : ""}. Zkuste to znovu.`;
}

export function formatDate(date: Date | string, locale = "cs-CZ"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: "var(--rarity-common)",
    uncommon: "var(--rarity-uncommon)",
    rare: "var(--rarity-rare)",
    epic: "var(--rarity-epic)",
    legendary: "var(--rarity-legendary)",
    mythic: "var(--rarity-legendary)", // uses animated gradient via CSS class
    limited: "var(--rarity-limited)",
  };
  return colors[rarity];
}

/** XP threshold for a given level: floor(250 * N^1.6); level 1 starts at 0. Mirrored in functions/src/index.ts. */
export function getXPForLevel(level: number): number {
  return level <= 1 ? 0 : Math.floor(250 * Math.pow(level, 1.6));
}

/** Derives current level from total XP accumulated */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (level < 100 && getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function getXPToNextLevel(xp: number): { current: number; required: number; level: number } {
  const level = getLevelFromXP(xp);
  const current = xp - getXPForLevel(level);
  const required = getXPForLevel(level + 1) - getXPForLevel(level);
  return { current, required, level };
}

export function getLevelTier(level: number): LevelTier {
  if (level >= 76) return "diamond";
  if (level >= 51) return "gold";
  if (level >= 26) return "silver";
  return "bronze";
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
