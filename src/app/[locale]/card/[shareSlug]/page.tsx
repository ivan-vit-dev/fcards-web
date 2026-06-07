"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CardPreview } from "@/components/card/CardPreview";
import { RarityBadge } from "@/components/card/RarityBadge";
import { ShareButtons } from "@/components/share/ShareButtons";
import { QRCodePanel } from "@/components/share/QRCodePanel";
import { getCardBySlug } from "@/lib/firebaseServices";
import { getCardShareUrl } from "@/lib/shareUtils";
import { CARD_TYPE_LABELS } from "@/lib/cardEngine";
import type { Card } from "@/types";

export default function PublicCardPage() {
  const params = useParams();
  const shareSlug = params?.shareSlug as string;
  const locale = (params?.locale as string) ?? "cs";

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!shareSlug) return;
    getCardBySlug(shareSlug).then((c) => {
      if (!c || !c.isPublic) setNotFound(true);
      else setCard(c);
      setLoading(false);
    });
  }, [shareSlug]);

  const shareUrl = card ? getCardShareUrl(card.shareSlug, locale) : "";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-20 space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-lg font-display font-bold">Kartička nenalezena</p>
            <p className="text-sm text-muted-foreground">
              Tato kartička neexistuje nebo není veřejná.
            </p>
            <Link href={`/${locale}`} className="text-sm text-primary hover:underline">
              Zpět na hlavní stránku
            </Link>
          </div>
        )}

        {!loading && card && (
          <div className="space-y-8">
            {/* Card preview */}
            <div className="flex justify-center">
              <CardPreview card={card} size="lg" />
            </div>

            {/* Meta */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RarityBadge rarity={card.rarity} />
                    <span className="text-sm text-muted-foreground">
                      {CARD_TYPE_LABELS[card.cardType]}
                    </span>
                    {card.season && (
                      <span className="text-sm text-muted-foreground">· {card.season}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.shareCount > 0 && `${card.shareCount}× sdíleno`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setQrOpen(true)}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR kód
                </Button>
              </div>

              {/* Stats */}
              {card.cardStats && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Góly", value: card.cardStats.goals },
                    { label: "Asistence", value: card.cardStats.assists },
                    { label: "Hodnocení", value: card.cardStats.rating },
                  ]
                    .filter((s) => s.value !== undefined)
                    .map(({ label, value }) => (
                      <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-2xl font-display font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Share */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <p className="text-sm font-semibold">Sdílet kartičku</p>
              <ShareButtons card={card} locale={locale} />
            </div>

            {/* Branding */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Vytvořeno pomocí{" "}
                <Link href={`/${locale}`} className="text-primary hover:underline font-medium">
                  Fotbalové Kartičky
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* QR dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR kód kartičky</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {shareUrl && (
              <QRCodePanel url={shareUrl} filename={`kartička-${shareSlug}`} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
