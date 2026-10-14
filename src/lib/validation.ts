import { z } from "zod";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function currentSeason(): string {
  const y = new Date().getFullYear();
  return `${y}/${String(y + 1).slice(-2)}`;
}

// Returns a Czech error message, or null when the season is valid ("2025/26").
export function validateSeason(season: string): string | null {
  const value = season.trim();
  if (!value) return "Zadejte sezónu.";
  const m = /^(\d{4})\/(\d{2})$/.exec(value);
  if (!m) return "Sezónu zadejte ve tvaru 2025/26.";
  const first = Number(m[1]);
  if ((first + 1) % 100 !== Number(m[2])) {
    return "Druhý rok musí navazovat na první, např. 2025/26.";
  }
  if (first < 2000 || first > new Date().getFullYear() + 1) {
    return "Zkontrolujte prosím rok sezóny.";
  }
  return null;
}

export const seasonField = z.string().superRefine((value, ctx) => {
  const error = validateSeason(value);
  if (error) ctx.addIssue({ code: "custom", message: error });
});

// Whole numbers typed into text inputs; kept as strings so empty fields get a friendly message.
export function intField(opts: {
  min: number;
  max: number;
  emptyMessage?: string; // omit to make the field optional
  rangeMessage: string;
}) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        if (opts.emptyMessage) ctx.addIssue({ code: "custom", message: opts.emptyMessage });
        return;
      }
      const n = Number(value);
      if (!/^\d+$/.test(value) || n < opts.min || n > opts.max) {
        ctx.addIssue({ code: "custom", message: opts.rangeMessage });
      }
    });
}

export const toInt = (value: string) => (value.trim() === "" ? 0 : Number(value));
