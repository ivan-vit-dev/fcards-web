"use client";

import { useEffect, useState, useCallback } from "react";
import { Printer, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintFormatSelector } from "@/components/print/PrintFormatSelector";
import { CardSelectionGrid } from "@/components/print/CardSelectionGrid";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore } from "@/store/appStore";
import { getCards } from "@/lib/firebaseServices";
import { exportCardsToPDF, PRINT_FORMATS, type PrintFormat } from "@/lib/printEngine";
import { canPrint, canUsePrintFormat, getLimits } from "@/lib/subscriptionEngine";
import type { Card } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PrintPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "cs";

  const { user } = useAuthStore();
  const { cards, setCards } = useCardsStore();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<PrintFormat>("a4-9");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    getCards(user.uid).then((c) => {
      setCards(c);
      setLoading(false);
    });
  }, [user, setCards]);

  const tier = user?.subscriptionTier ?? "free";
  const limits = getLimits(tier);
  const hasPrintAccess = canPrint(tier);

  const availableFormats = PRINT_FORMATS.filter((f) =>
    canUsePrintFormat(tier, f.id)
  ).map((f) => f.id);

  const activeFormat = PRINT_FORMATS.find((f) => f.id === format)!;
  const maxCards = activeFormat.maxCards;

  const printableCards: Card[] = cards.filter((c) => c.isPublic || c.imageUrl);

  const toggleCard = useCallback((cardId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < maxCards) {
        next.add(cardId);
      }
      return next;
    });
  }, [maxCards]);

  const handleFormatChange = (f: PrintFormat) => {
    setFormat(f);
    // Trim selection to new max
    const newMax = PRINT_FORMATS.find((fmt) => fmt.id === f)!.maxCards;
    setSelected((prev) => {
      if (prev.size <= newMax) return prev;
      return new Set(Array.from(prev).slice(0, newMax));
    });
  };

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error("Vyberte alespoň jednu kartičku.");
      return;
    }
    const selectedCards = printableCards.filter((c) => selected.has(c.id));
    setExporting(true);
    setProgress(0);
    try {
      await exportCardsToPDF(selectedCards, format, setProgress);
      toast.success(`PDF exportováno! ${selectedCards.length} ${selectedCards.length === 1 ? "kartička" : "karet"}.`);
    } catch (err) {
      console.error(err);
      toast.error("Export se nezdařil. Zkuste to znovu.");
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  // No print access
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
            <p className="font-display font-bold text-lg">Tisk karet vyžaduje Premium</p>
            <p className="text-sm text-muted-foreground mt-1">
              Bezplatný plán neumožňuje tisk. Upgradujte na Premium pro tisk A4 archů,
              nálepkových archů a album stránek.
            </p>
          </div>
          <Link href={`/${locale}/settings/subscription`}>
            <Button className="mt-2">Zobrazit plány</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Tiskové centrum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Exportujte kartičky do PDF pro fyzický tisk
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
              {progress > 0 ? `${progress}%` : "Generuji…"}
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Exportovat PDF
            </>
          )}
        </Button>
      </div>

      {/* Tier limits notice */}
      {limits.cardsPerMonth !== -1 && (
        <div className="flex items-start gap-2.5 p-3 bg-muted/60 rounded-xl text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Plán <strong>{tier}</strong>: dostupné formáty {availableFormats.join(", ")}.{" "}
            <Link href={`/${locale}/settings/subscription`} className="text-primary hover:underline">
              Upgradujte
            </Link>{" "}
            pro přístup ke všem formátům.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: card selection */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-3">
              1. Vyberte kartičky{" "}
              <span className="text-muted-foreground font-normal">(max. {maxCards})</span>
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <CardSelectionGrid
                cards={printableCards}
                selected={selected}
                maxSelectable={maxCards}
                onToggle={toggleCard}
              />
            )}
          </div>
        </div>

        {/* Right: format + export summary */}
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold mb-3">2. Formát tisku</h2>
            <PrintFormatSelector
              selected={format}
              onSelect={handleFormatChange}
              availableFormats={availableFormats}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold">Shrnutí</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Formát</span>
              <span>{activeFormat.labelCs}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Karet</span>
              <span>{selected.size} / {maxCards}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Stran PDF</span>
              <span>{Math.max(1, Math.ceil(selected.size / (activeFormat.cols * activeFormat.rows)))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
