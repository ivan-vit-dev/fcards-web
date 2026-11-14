import type { User } from "@/types";

// Bump when the terms or the privacy policy change materially: every user is asked to
// accept the new version on their next visit (ConsentGate in AppShell).
export const LEGAL_VERSION = "2026-11-14";

// Czech age of digital consent (zákon č. 110/2019 Sb., § 7). Younger children need a
// parent or guardian to create and run the account.
export const DIGITAL_CONSENT_AGE = 15;

export function hasAcceptedTerms(user: User | null): boolean {
  return user?.consents?.termsVersion === LEGAL_VERSION;
}

export function hasAIConsent(user: User | null): boolean {
  return !!user?.consents?.aiPhotosAt;
}

// Operator (data controller) shown in the legal documents. FILL IN before launch.
export const OPERATOR = {
  name: "[DOPLNIT: jméno / název provozovatele]",
  id: "[DOPLNIT: IČO]",
  address: "[DOPLNIT: sídlo]",
  email: "[DOPLNIT: kontaktní e-mail]",
};

// Third parties that receive data — shown in the AI consent dialog and the privacy policy.
export const AI_PROCESSORS = [
  {
    name: "Replicate, Inc. (USA)",
    purpose: "úpravy fotek: póza, emoce, styl, vylepšení tváře, odstranění pozadí, stadion",
    data: "fotka hráče",
  },
  {
    name: "Google LLC (USA), přes Replicate",
    purpose: "model Nano Banana pro úpravy fotek",
    data: "fotka hráče",
  },
  {
    name: "Anthropic PBC (USA)",
    purpose: "text příběhu kartičky",
    data: "jméno hráče, pozice a statistiky (bez fotky)",
  },
] as const;
