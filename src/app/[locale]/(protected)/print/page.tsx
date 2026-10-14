"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Printer, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardPreview } from "@/components/card/CardPreview";
import { PrintFormatSelector } from "@/components/print/PrintFormatSelector";
import { CardSelectionGrid } from "@/components/print/CardSelectionGrid";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore, usePlayersStore } from "@/store/appStore";
import { getCards, getPlayers, incrementCardPrintCount } from "@/lib/firebaseServices";
import { exportCardsToPDF, PRINT_FORMATS, type PrintFormat } from "@/lib/printEngine";
import { TIER_LABELS, canPrint, canUsePrintFormat } from "@/lib/subscriptionEngine";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PrintPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const { user } = useAuthStore();
  const { cards, setCards, updateCard } = useCardsStore();
  const { players, setPlayers } = usePlayersStore();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<PrintFormat>("a4-9");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const renderRoot = useRef<HTMLDivElement>(null);

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    Promise.all([getCards(uid), getPlayers(uid)])
      .then(([c, p]) => {
        setCards(c);
        setPlayers(p);
      })
      .catch((err) => {
        console.warn("[PrintPage]", err);
        toast.error("Kartičky se nepodařilo načíst.");
      })
      .finally(() => setLoading(false));
  }, [uid, setCards, setPlayers]);

  const tier = user?.subscriptionTier ?? "free";
  const isAdmin = user?.role === "superAdmin";
  const hasPrintAccess = isAdmin || canPrint(tier);

  const availableFormats = PRINT_FORMATS.filter(
    (f) => isAdmin || canUsePrintFormat(tier, f.id)
  ).map((f) => f.id);
  const lockedFormats = PRINT_FORMATS.filter((f) => !availableFormats.includes(f.id));

  const activeFormat = PRINT_FORMATS.find((f) => f.id === format)!;
  const maxCards = activeFormat.maxCards;
  const selectedCards = cards.filter((c) => selected.has(c.id));

  const toggleCard = useCallback(
    (cardId: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(cardId)) {
          next.delete(cardId);
        } else if (next.size < maxCards) {
          next.add(cardId);
        }
        return next;
      });
    },
    [maxCards]
  );

  const handleFormatChange = (f: PrintFormat) => {
    setFormat(f);
    const newMax = PRINT_FORMATS.find((fmt) => fmt.id === f)!.maxCards;
    setSelected((prev) => (prev.size <= newMax ? prev : new Set(Array.from(prev).slice(0, newMax))));
  };

  const handleExport = async () => {
    if (selectedCards.length === 0) {
      toast.error("Vyberte alespoň jednu kartičku.");
      return;
    }
    setExporting(true);
    setProgress(0);
    try {
      // Render each card exactly as on screen (template, photo, stats) at print resolution.
      const images: string[] = [];
      for (const [i, card] of selectedCards.entries()) {
        const node = renderRoot.current?.querySelector<HTMLElement>(`[data-print-card="${card.id}"]`);
        if (!node) throw new Error(`Missing render node for ${card.id}`);
        images.push(await toPng(node, { pixelRatio: 3, cacheBust: true }));
        setProgress(Math.round(((i + 1) / selectedCards.length) * 100));
      }

      exportCardsToPDF(images, format);

      await Promise.allSettled(selectedCards.map((c) => incrementCardPrintCount(c.id)));
      selectedCards.forEach((c) => updateCard(c.id, { printCount: (c.printCount ?? 0) + 1 }));

      toast.success(
        `PDF je připravené: ${selectedCards.length} ${selectedCards.length === 1 ? "kartička" : "karet"}.`
      );
    } catch (err) {
      console.warn("[PrintPage] export", err);
      toast.error("Export se nezdařil. Zkuste to prosím znovu.");
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  if (!hasPrintAccess) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Tiskové centrum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Exportujte kartičky do PDF pro fyzický tisk
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-lg">Tisk karet je dostupný od tarifu Premium</p>
            <p className="text-sm text-muted-foreground mt-1">
              S tarifem Premium vytisknete A4 archy, s tarifem Team i nálepkové archy a album
              stránky.
            </p>
          </div>
          <Link href={`/${locale}/settings/subscription`}>
            <Button className="mt-2">Zobrazit tarify</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Tiskové centrum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vyberte kartičky a formát, stáhnete PDF připravené k tisku.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || selected.size === 0}
          className="gap-2 shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress > 0 ? `${progress} %` : "Připravuji…"}
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Stáhnout PDF
            </>
          )}
        </Button>
      </div>

      {lockedFormats.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-muted/60 rounded-xl text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Tarif <strong>{TIER_LABELS[tier]}</strong> nezahrnuje formáty{" "}
            {lockedFormats.map((f) => f.labelCs).join(", ")}.{" "}
            <Link href={`/${locale}/settings/subscription`} className="text-primary hover:underline">
              Zobrazit tarify
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold">
            1. Vyberte kartičky{" "}
            <span className="text-muted-foreground font-normal">(max. {maxCards} na arch)</span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <CardSelectionGrid
              cards={cards}
              players={players}
              selected={selected}
              maxSelectable={maxCards}
              onToggle={toggleCard}
            />
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold mb-3">2. Formát tisku</h2>
            <PrintFormatSelector
              selected={format}
              onSelect={handleFormatChange}
              availableFormats={availableFormats}
            />
          </div>

          <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold">Shrnutí</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Formát</span>
              <span>{activeFormat.labelCs}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Karet</span>
              <span>
                {selected.size} / {maxCards}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Tiskněte ve skutečné velikosti (100 %), bez přizpůsobení stránce.
            </p>
          </div>
        </div>
      </div>

      {/* Off-screen full-size renders captured into the PDF */}
      <div ref={renderRoot} aria-hidden className="fixed top-0 -left-[10000px] pointer-events-none">
        {selectedCards.map((card) => (
          <div key={card.id} data-print-card={card.id} className="inline-block">
            <CardPreview
              card={card}
              player={players.find((p) => p.id === card.playerId)}
              size="lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
