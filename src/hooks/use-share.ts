"use client";

import { useCallback, useState } from "react";
import { toPng } from "html-to-image";
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
  captureNode?: () => HTMLElement | null; // rendered card to save for "download"
}

export function useShare({ card, locale = "cs", playerName, captureNode }: UseShareOptions) {
  const [sharing, setSharing] = useState(false);
  const shareUrl = getCardShareUrl(card.shareSlug, locale);
  const shareText = playerName
    ? `Podívejte se na mou fotbalovou kartičku hráče ${playerName}! 🎴⚽`
    : "Podívejte se na mou fotbalovou kartičku! 🎴⚽";

  const trackAndShare = useCallback(async () => {
    await incrementShareCount(card.id).catch(() => {});
  }, [card.id]);

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

          case "download": {
            // Prefer rendering the card shown on the page; a cross-origin URL would just open
            // in a new tab because browsers ignore `download` for other origins.
            const node = captureNode?.();
            const href = node
              ? await toPng(node, { pixelRatio: 3, cacheBust: true })
              : card.imageUrl;
            if (!href) {
              toast.error("Obrázek kartičky není k dispozici.");
              break;
            }
            const a = document.createElement("a");
            a.href = href;
            a.download = `karticka-${card.shareSlug}.png`;
            a.click();
            await trackAndShare();
            break;
          }
        }
      } catch (err) {
        // Closing the native share sheet rejects with AbortError — not a failure.
        if ((err as { name?: string }).name !== "AbortError") {
          toast.error("Sdílení se nepodařilo. Zkuste zkopírovat odkaz.");
        }
      } finally {
        setSharing(false);
      }
    },
    [sharing, shareUrl, shareText, trackAndShare, card.imageUrl, card.shareSlug, captureNode]
  );

  return { share, sharing, shareUrl, shareText };
}
