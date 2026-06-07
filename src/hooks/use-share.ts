"use client";

import { useCallback, useState } from "react";
import {
  getCardShareUrl,
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  buildMessengerShareUrl,
  incrementShareCount,
} from "@/lib/shareUtils";
import type { Card } from "@/types";
import toast from "react-hot-toast";

export type SharePlatform =
  | "native"
  | "facebook"
  | "whatsapp"
  | "messenger"
  | "copy"
  | "download"
  | "tiktok";

interface UseShareOptions {
  card: Card;
  locale?: string;
  playerName?: string;
}

export function useShare({ card, locale = "cs", playerName }: UseShareOptions) {
  const [sharing, setSharing] = useState(false);
  const shareUrl = getCardShareUrl(card.shareSlug, locale);
  const shareText = playerName
    ? `Podívejte se na mou fotbalovou kartičku hráče ${playerName}! 🎴⚽`
    : "Podívejte se na mou fotbalovou kartičku! 🎴⚽";

  const trackAndShare = useCallback(async () => {
    await incrementShareCount(card.id, card.shareCount).catch(() => {});
  }, [card.id, card.shareCount]);

  const share = useCallback(
    async (platform: SharePlatform) => {
      if (sharing) return;
      setSharing(true);
      try {
        switch (platform) {
          case "native":
            if (navigator.share) {
              await navigator.share({ title: shareText, url: shareUrl });
              await trackAndShare();
            } else {
              await navigator.clipboard.writeText(shareUrl);
              toast.success("Odkaz zkopírován!");
              await trackAndShare();
            }
            break;

          case "copy":
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Odkaz zkopírován!");
            await trackAndShare();
            break;

          case "facebook":
            window.open(buildFacebookShareUrl(shareUrl), "_blank", "width=600,height=400");
            await trackAndShare();
            break;

          case "whatsapp":
            window.open(buildWhatsAppShareUrl(shareUrl, shareText), "_blank");
            await trackAndShare();
            break;

          case "messenger":
            window.open(buildMessengerShareUrl(shareUrl), "_blank", "width=600,height=400");
            await trackAndShare();
            break;

          case "tiktok":
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Odkaz zkopírován! Vložte do TikToku.");
            window.open("https://www.tiktok.com/", "_blank");
            await trackAndShare();
            break;

          case "download":
            if (card.imageUrl) {
              const a = document.createElement("a");
              a.href = card.imageUrl;
              a.download = `kartička-${card.shareSlug}.png`;
              a.click();
              await trackAndShare();
            } else {
              toast.error("Obrázek kartičky není k dispozici.");
            }
            break;
        }
      } finally {
        setSharing(false);
      }
    },
    [sharing, shareUrl, shareText, trackAndShare, card.imageUrl, card.shareSlug]
  );

  return { share, sharing, shareUrl, shareText };
}
