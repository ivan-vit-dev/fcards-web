import type { ReportReason } from "@/types";

// Keep in sync with REPORT_REASONS / AUTO_HIDE_AT in functions/src/index.ts.
export const AUTO_HIDE_AT = 3;

export const REPORT_REASONS: Record<ReportReason, { label: string; hint: string }> = {
  inappropriate: { label: "Nevhodný obsah", hint: "Nahota, násilí, vulgarity nebo jiný obsah, který nepatří k dětem." },
  noConsent: { label: "Fotka bez souhlasu", hint: "Jsem na fotce já nebo moje dítě a nesouhlasím se zveřejněním." },
  bullying: { label: "Zesměšňování nebo šikana", hint: "Kartička nebo profil někoho uráží či zesměšňuje." },
  other: { label: "Něco jiného", hint: "Popište prosím, co je špatně." },
};
