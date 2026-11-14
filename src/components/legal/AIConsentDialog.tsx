"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AI_PROCESSORS } from "@/lib/legal";

/** One-time consent before the first AI job: photos leave the app for AI services in the USA. */
export function AIConsentDialog({
  open,
  onCancel,
  onAccept,
}: {
  open: boolean;
  onCancel: () => void;
  onAccept: () => Promise<void>;
}) {
  const locale = (useParams()?.locale as string) ?? "cs";
  const [saving, setSaving] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !saving && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Souhlas s úpravou fotek pomocí AI
          </AlertDialogTitle>
          <AlertDialogDescription render={<div />} className="space-y-3 text-left">
            <p>
              AI úpravy neprobíhají v aplikaci. Fotka hráče se odešle k těmto službám, které ji
              zpracují a výsledek vrátí:
            </p>
            <ul className="space-y-1.5">
              {AI_PROCESSORS.map((p) => (
                <li key={p.name} className="rounded-lg bg-muted/60 px-3 py-2">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="block text-xs">
                    {p.purpose} · posíláme: {p.data}
                  </span>
                </li>
              ))}
            </ul>
            <p>
              Služby sídlí v USA. Výsledky ukládáme u vaší kartičky, dokud je nesmažete. Souhlas můžete
              kdykoli odvolat v Nastavení → Soukromí a účet. Podrobnosti najdete v{" "}
              <Link href={`/${locale}/legal/privacy`} target="_blank" className="text-primary hover:underline">
                zásadách ochrany osobních údajů
              </Link>
              .
            </p>
            <p className="font-medium text-foreground">
              Je-li hráči méně než 15 let, souhlas musí dát rodič nebo zákonný zástupce.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Teď ne</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onAccept();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Ukládání…" : "Souhlasím"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
