"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityBadge } from "@/components/card/RarityBadge";
import { getTemplates } from "@/lib/firebaseServices";
import type { Card, Template, Rarity } from "@/types";

const RARITIES: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "limited",
];

interface DesignPanelProps {
  card: Card;
  onUpdateTemplate: (template: Template) => void;
  onUpdateRarity: (rarity: Rarity) => void;
}

export function DesignPanel({
  card,
  onUpdateTemplate,
  onUpdateRarity,
}: DesignPanelProps) {
  const t = useTranslations("editor");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .finally(() => setLoadingTemplates(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Rarity picker */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {t("rarity")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => onUpdateRarity(r)}
              className={cn(
                "transition-all",
                card.rarity === r
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <RarityBadge rarity={r} />
            </button>
          ))}
        </div>
      </div>

      {/* Template picker */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          {t("template")}
        </p>

        {loadingTemplates ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("noTemplates")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => onUpdateTemplate(tmpl)}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 transition-all aspect-[3/4] bg-muted/40",
                  card.templateId === tmpl.id
                    ? "border-primary shadow-glow"
                    : "border-border hover:border-primary/50"
                )}
                title={tmpl.nameCs}
              >
                {tmpl.previewURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tmpl.previewURL}
                    alt={tmpl.nameCs}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground text-center px-1">
                      {tmpl.nameCs}
                    </span>
                  </div>
                )}
                {card.templateId === tmpl.id && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
