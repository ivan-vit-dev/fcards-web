import { updateCard } from "./firebaseServices";

export function getCardShareUrl(shareSlug: string, locale = "cs"): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "https://fotbalove-karticky.cz";
  return `${base}/${locale}/card/${shareSlug}`;
}

export function getPlayerProfileUrl(slug: string, locale = "cs"): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "https://fotbalove-karticky.cz";
  return `${base}/${locale}/player/${slug}`;
}

export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildWhatsAppShareUrl(url: string, text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function buildMessengerShareUrl(url: string): string {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=&redirect_uri=${encodeURIComponent(url)}`;
}

export async function incrementShareCount(cardId: string, currentCount: number): Promise<void> {
  await updateCard(cardId, { shareCount: currentCount + 1 } as never);
}
