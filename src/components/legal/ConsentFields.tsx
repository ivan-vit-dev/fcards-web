"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { AgeConfirmation } from "@/types";

export type AgeChoice = AgeConfirmation | "under15";

const AGE_OPTIONS: { id: AgeChoice; label: string }[] = [
  { id: "15plus", label: "Je mi 15 let nebo víc" },
  { id: "guardian", label: "Jsem rodič nebo zákonný zástupce a účet zakládám pro dítě" },
  { id: "under15", label: "Je mi méně než 15 let" },
];

/** Age confirmation + acceptance of the terms and privacy policy (registration and ConsentGate). */
export function ConsentFields({
  age,
  onAge,
  terms,
  onTerms,
  error,
}: {
  age: AgeChoice | null;
  onAge: (age: AgeChoice) => void;
  terms: boolean;
  onTerms: (accepted: boolean) => void;
  error?: string;
}) {
  const locale = (useParams()?.locale as string) ?? "cs";
  const docLink = (path: string, label: string) => (
    <Link href={`/${locale}/legal/${path}`} target="_blank" className="text-primary hover:underline">
      {label}
    </Link>
  );

  return (
    <div className="space-y-3">
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium mb-1.5">Kdo účet zakládá?</legend>
        {AGE_OPTIONS.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-2.5 text-sm cursor-pointer transition-colors",
              age === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <input
              type="radio"
              name="age"
              value={o.id}
              checked={age === o.id}
              onChange={() => onAge(o.id)}
              className="mt-0.5 accent-[var(--primary)]"
            />
            {o.label}
          </label>
        ))}
      </fieldset>

      {age === "under15" && (
        <p className="rounded-lg bg-muted p-3 text-sm">
          Do 15 let potřebuješ rodiče. Požádej maminku, tátu nebo jiného zákonného zástupce, ať účet
          založí on a vybere možnost „Jsem rodič nebo zákonný zástupce“.
        </p>
      )}

      <label className="flex items-start gap-2.5 text-sm cursor-pointer">
        <Checkbox checked={terms} onCheckedChange={(v) => onTerms(v === true)} className="mt-0.5" />
        <span>
          Souhlasím s {docLink("terms", "podmínkami použití")} a beru na vědomí{" "}
          {docLink("privacy", "zásady ochrany osobních údajů")}.
        </span>
      </label>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export function consentError(age: AgeChoice | null, terms: boolean): string | null {
  if (!age) return "Vyberte, kdo účet zakládá.";
  if (age === "under15") return "Účet pro dítě do 15 let musí založit rodič.";
  if (!terms) return "Pro pokračování je potřeba souhlasit s podmínkami.";
  return null;
}
