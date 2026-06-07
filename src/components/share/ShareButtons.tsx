"use client";

import { Link2, Download, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShare } from "@/hooks/use-share";
import type { Card } from "@/types";

interface Props {
  card: Card;
  locale?: string;
  playerName?: string;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.85a8.27 8.27 0 004.84 1.54V6.96a4.86 4.86 0 01-1.07-.27z" />
    </svg>
  );
}

export function ShareButtons({ card, locale, playerName }: Props) {
  const { share, sharing } = useShare({ card, locale, playerName });

  return (
    <div className="space-y-3">
      {/* Native share on mobile */}
      <Button className="w-full gap-2" onClick={() => share("native")} disabled={sharing}>
        <Share2 className="h-4 w-4" />
        Sdílet kartičku
      </Button>

      {/* Platform-specific */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs bg-[#1877f2] hover:bg-[#1564d3] text-white border-transparent"
          onClick={() => share("facebook")}
          disabled={sharing}
        >
          <FacebookIcon className="h-3.5 w-3.5 shrink-0" />
          Facebook
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs bg-[#25d366] hover:bg-[#1da851] text-white border-transparent"
          onClick={() => share("whatsapp")}
          disabled={sharing}
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => share("copy")}
          disabled={sharing}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          Zkopírovat odkaz
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => share("download")}
          disabled={sharing}
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          Stáhnout
        </Button>
      </div>

      {/* TikTok */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs bg-black hover:bg-zinc-900 text-white border-transparent"
        onClick={() => share("tiktok")}
        disabled={sharing}
      >
        <TikTokIcon className="h-3.5 w-3.5 shrink-0" />
        TikTok
      </Button>
    </div>
  );
}
