"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronRight, Loader2, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardPreview } from "./CardPreview";
import { RarityBadge } from "./RarityBadge";
import {
  computeDefaultRarity,
  buildCardStats,
  generateShareSlug,
  CARD_TYPES,
  CARD_TYPE_LABELS,
  CARD_TYPE_DESCRIPTIONS,
} from "@/lib/cardEngine";
import { TIER_LABELS, tierAtLeast } from "@/lib/subscriptionEngine";
import { getPlayerMatchStats } from "@/lib/firebaseServices";
import { currentSeason, validateSeason } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type {
  Player,
  Match,
  Template,
  Card,
  CardType,
  Rarity,
  PlayerMatchStats,
  SubscriptionTier,
} from "@/types";
import toast from "react-hot-toast";

const STEPS = ["Hráč", "Typ", "Šablona", "Obsah", "Náhled"] as const;

interface WizardData {
  playerId: string;
  player: Player | null;
  cardType: CardType;
  templateId: string;
  template: Template | null;
  matchId?: string;
  matchStats?: PlayerMatchStats | null;
  season: string;
  rarity: Rarity;
}

interface CardGeneratorWizardProps {
  userTier: SubscriptionTier;
  isAdmin: boolean;
  locale: string;
  players: Player[];
  matches: Match[];
  templates: Template[];
  onGenerate: (draft: Partial<Card>) => Promise<void>;
}

const positionLabels: Record<string, string> = {
  goalkeeper: "Brankář",
  defender: "Obránce",
  midfielder: "Záložník",
  forward: "Útočník",
};

const MATCH_TYPES: CardType[] = ["match", "mvp"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-display font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex gap-2 rounded-lg border p-3 text-xs leading-relaxed",
        tone === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
        tone === "warning" && "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400",
        tone === "info" && "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 mb-8" aria-label="Postup vytváření kartičky">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className="flex items-center gap-1 flex-1 last:flex-none"
          aria-current={i === current ? "step" : undefined}
        >
          <div
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-colors",
              i < current && "bg-primary text-primary-foreground",
              i === current && "bg-primary/20 text-primary border border-primary",
              i > current && "bg-muted text-muted-foreground"
            )}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs hidden sm:block",
              i === current ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 mx-1 transition-colors",
                i < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

// ─── Step 1: Select player ────────────────────────────────────────────────────

function StepPlayer({
  players,
  selectedId,
  onSelect,
}: {
  players: Player[];
  selectedId: string;
  onSelect: (p: Player) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = players.filter((p) =>
    p.displayName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <StepHeader
        title="Vyber hráče"
        description="Pro koho kartičku vytváříte?"
      />
      {players.length > 5 && (
        <Input
          placeholder="Hledat podle jména…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Hledat hráče"
        />
      )}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Žádný hráč neodpovídá hledání „{search}“.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-0.5">
          {filtered.map((player) => {
            const isSelected = player.id === selectedId;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelect(player)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left border",
                  isSelected
                    ? "bg-primary/10 border-primary/40"
                    : "border-border hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={player.photoURL} />
                  <AvatarFallback className="font-display text-sm">
                    {initialsOf(player.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{player.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {positionLabels[player.position] ?? "Pozice neuvedena"}
                    {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
                  </p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Card type ────────────────────────────────────────────────────────

function StepCardType({
  selected,
  onSelect,
}: {
  selected: CardType;
  onSelect: (t: CardType) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        title="Typ kartičky"
        description="Zvolte typ, který nejlépe vystihuje příležitost."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CARD_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            aria-pressed={selected === type}
            className={cn(
              "p-3 rounded-xl text-left transition-colors border",
              selected === type
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "border-border hover:border-primary/30 hover:bg-muted/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{CARD_TYPE_LABELS[type]}</p>
              {MATCH_TYPES.includes(type) && (
                <span className="text-[10px] text-muted-foreground shrink-0">ze zápasu</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {CARD_TYPE_DESCRIPTIONS[type]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Template ─────────────────────────────────────────────────────────

function StepTemplate({
  templates,
  selectedId,
  isAllowed,
  locale,
  sampleCard,
  player,
  onSelect,
}: {
  templates: Template[];
  selectedId: string;
  isAllowed: (t: Template) => boolean;
  locale: string;
  sampleCard: Card;
  player: Player | null;
  onSelect: (t: Template) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader title="Šablona" description="Vyberte vzhled kartičky." />
      {templates.length === 0 ? (
        <Notice tone="error">
          Zatím nejsou dostupné žádné šablony. Administrátor je nahraje v sekci Administrace →
          „Nahrát výchozí data“.
        </Notice>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templates.map((tpl) => {
            const allowed = isAllowed(tpl);
            const selected = selectedId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => allowed && onSelect(tpl)}
                disabled={!allowed}
                aria-pressed={selected}
                className={cn(
                  "relative rounded-xl overflow-hidden border-2 text-left transition-colors",
                  selected ? "border-primary" : "border-border",
                  allowed ? "hover:border-primary/50" : "cursor-not-allowed"
                )}
              >
                <div className="flex justify-center bg-muted/40 py-3">
                  <CardPreview
                    card={sampleCard}
                    player={player ?? undefined}
                    template={tpl}
                    size="sm"
                  />
                </div>
                {selected && (
                  <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                {!allowed && (
                  <span className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </span>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{tpl.nameCs}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tpl.requiredTier === "free"
                      ? "Zdarma"
                      : `Od tarifu ${TIER_LABELS[tpl.requiredTier]}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {templates.some((t) => !isAllowed(t)) && (
        <p className="text-xs text-muted-foreground">
          Zamčené šablony odemknete vyšším tarifem v{" "}
          <Link href={`/${locale}/settings/subscription`} className="text-primary hover:underline">
            nastavení předplatného
          </Link>
          .
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Content ──────────────────────────────────────────────────────────

function StepContent({
  data,
  matches,
  locale,
  showErrors,
  seasonError,
  onMatchSelect,
  onSeasonChange,
  onRarityChange,
  loadingStats,
}: {
  data: WizardData;
  matches: Match[];
  locale: string;
  showErrors: boolean;
  seasonError: string | null;
  onMatchSelect: (matchId: string) => void;
  onSeasonChange: (season: string) => void;
  onRarityChange: (rarity: Rarity) => void;
  loadingStats: boolean;
}) {
  const needsMatch = MATCH_TYPES.includes(data.cardType);
  const matchRequired = data.cardType === "match";
  const teamId = data.player?.teamId;
  const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
  const rarityLabels: Record<string, string> = {
    common: "Běžná",
    uncommon: "Neobvyklá",
    rare: "Vzácná",
    epic: "Epická",
    legendary: "Legendární",
  };
  const showSeasonError = showErrors && !!seasonError;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Obsah kartičky"
        description="Doplňte sezónu, případně zápas, ze kterého se vezmou statistiky."
      />

      <div className="space-y-1.5">
        <Label htmlFor="season">
          Sezóna<span className="ml-0.5 text-destructive" aria-hidden>*</span>
        </Label>
        <Input
          id="season"
          value={data.season}
          onChange={(e) => onSeasonChange(e.target.value)}
          placeholder="např. 2025/26"
          maxLength={7}
          aria-invalid={showSeasonError}
          aria-describedby="season-help"
        />
        <p
          id="season-help"
          className={cn("text-xs", showSeasonError ? "text-destructive" : "text-muted-foreground")}
        >
          {showSeasonError ? seasonError : "Ve tvaru rok/rok, např. 2025/26."}
        </p>
      </div>

      {needsMatch && (
        <div className="space-y-2">
          <Label>
            Zápas
            {matchRequired ? (
              <span className="ml-0.5 text-destructive" aria-hidden>*</span>
            ) : (
              <span className="ml-1 font-normal text-muted-foreground">(nepovinné)</span>
            )}
          </Label>

          {!teamId ? (
            <Notice tone={matchRequired ? "warning" : "info"}>
              {data.player?.displayName} zatím není v žádném týmu, takže nemá zápasy.{" "}
              <Link href={`/${locale}/teams`} className="underline">
                Přidejte ho do týmu
              </Link>
              {matchRequired ? " nebo zvolte jiný typ kartičky." : "."}
            </Notice>
          ) : matches.length === 0 ? (
            <Notice tone={matchRequired ? "warning" : "info"}>
              Tým hráče zatím nemá žádné zápasy.{" "}
              <Link href={`/${locale}/teams/${teamId}/matches/new`} className="underline">
                Přidat zápas
              </Link>
            </Notice>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto p-0.5">
              {!matchRequired && (
                <button
                  type="button"
                  onClick={() => onMatchSelect("")}
                  aria-pressed={!data.matchId}
                  className={cn(
                    "w-full p-2.5 rounded-lg text-left text-sm border transition-colors",
                    !data.matchId
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <span className="text-muted-foreground">Bez konkrétního zápasu</span>
                </button>
              )}
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onMatchSelect(match.id)}
                  disabled={loadingStats}
                  aria-pressed={data.matchId === match.id}
                  className={cn(
                    "w-full p-2.5 rounded-lg text-left border transition-colors",
                    data.matchId === match.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">vs. {match.opponent}</span>
                    <span className="text-sm font-display font-bold shrink-0">
                      {match.homeScore}:{match.awayScore}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{match.date}</span>
                </button>
              ))}
            </div>
          )}

          {loadingStats && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Načítám statistiky ze zápasu…
            </div>
          )}

          {data.matchId && !loadingStats && !data.matchStats && teamId && (
            <Notice tone="warning">
              V tomto zápase nemá {data.player?.displayName} zapsané statistiky.{" "}
              <Link
                href={`/${locale}/teams/${teamId}/matches/${data.matchId}`}
                className="underline"
              >
                Doplnit statistiky
              </Link>
            </Notice>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Vzácnost</Label>
        <div className="flex flex-wrap gap-2">
          {rarities.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRarityChange(r)}
              aria-pressed={data.rarity === r}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                data.rarity === r
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted/40 text-muted-foreground"
              )}
            >
              {rarityLabels[r]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Navržena automaticky podle typu a statistik. Můžete ji ručně změnit.
        </p>
      </div>
    </div>
  );
}

// ─── Step 5: Preview ──────────────────────────────────────────────────────────

function StepPreview({ data, generating }: { data: WizardData; generating: boolean }) {
  if (!data.player) return null;

  const draftCard: Partial<Card> = {
    cardType: data.cardType,
    rarity: data.rarity,
    templateId: data.templateId,
    templateStyle: data.template?.category,
    season: data.season.trim(),
    matchId: data.matchId,
    cardStats: buildCardStats(data.cardType, data.player, data.matchStats),
    aiStatus: "done",
    effect: "none",
    shareCount: 0,
    printCount: 0,
    isPublic: false,
  };

  const rows = [
    { label: "Hráč", value: `${data.player.displayName} · ${positionLabels[data.player.position] ?? ""}` },
    { label: "Typ", value: CARD_TYPE_LABELS[data.cardType] },
    { label: "Šablona", value: data.template?.nameCs ?? "—" },
    { label: "Sezóna", value: data.season.trim() },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        title="Náhled kartičky"
        description="Zkontrolujte údaje. Kartičku můžete později upravit v editoru."
      />

      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <CardPreview
          card={draftCard as Card}
          player={data.player}
          template={data.template ?? undefined}
          size="lg"
        />

        <div className="space-y-4 flex-1 w-full">
          <dl className="space-y-3">
            {rows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  {label}
                </dt>
                <dd className="text-sm mt-0.5">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                Vzácnost
              </dt>
              <dd>
                <RarityBadge rarity={data.rarity} />
              </dd>
            </div>
          </dl>

          {data.matchStats && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                Statistiky ze zápasu
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Góly", value: data.matchStats.goals },
                  { label: "Asistence", value: data.matchStats.assists },
                  { label: "Hodnocení", value: data.matchStats.rating },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2 text-center">
                    <p className="font-display font-bold text-sm">{value ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {generating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Vytvářím kartičku…
        </div>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function CardGeneratorWizard({
  userTier,
  isAdmin,
  locale,
  players,
  matches,
  templates,
  onGenerate,
}: CardGeneratorWizardProps) {
  const isTemplateAllowed = (t: Template) => isAdmin || tierAtLeast(userTier, t.requiredTier);
  const defaultTemplate = templates.find(isTemplateAllowed) ?? null;

  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [data, setData] = useState<WizardData>({
    playerId: "",
    player: null,
    cardType: "match",
    templateId: defaultTemplate?.id ?? "",
    template: defaultTemplate,
    season: currentSeason(),
    rarity: "common",
  });

  const playerTeamId = data.player?.teamId;
  const playerMatches = playerTeamId ? matches.filter((m) => m.teamId === playerTeamId) : [];
  const seasonError = validateSeason(data.season);

  // Returns the first problem that blocks leaving the given step, in plain Czech.
  const stepError = (s: number): string | null => {
    if (s === 0 && !data.player) return "Vyberte hráče, pro kterého kartičku vytváříte.";
    if (s === 2) {
      if (templates.length === 0) return "Bez šablony nelze kartičku vytvořit.";
      if (!data.template) return "Vyberte šablonu kartičky.";
    }
    if (s === 3) {
      if (seasonError) return seasonError;
      if (loadingStats) return "Počkejte prosím na načtení statistik ze zápasu.";
      if (data.cardType === "match") {
        if (!data.matchId) return "Zápasová kartička potřebuje vybraný zápas.";
        if (!data.matchStats) return "Hráč v tomto zápase nemá zapsané statistiky.";
      }
    }
    return null;
  };

  const currentError = showErrors ? stepError(step) : null;

  const goNext = () => {
    if (stepError(step)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((s) => s - 1);
  };

  const handleSelectPlayer = (player: Player) => {
    // Match stats belong to the previous player, so drop them.
    setData((d) => ({
      ...d,
      playerId: player.id,
      player,
      matchId: undefined,
      matchStats: undefined,
      rarity: computeDefaultRarity(d.cardType, null, player),
    }));
  };

  const handleSelectCardType = (cardType: CardType) => {
    setData((d) => {
      const keepMatch = MATCH_TYPES.includes(cardType);
      const matchStats = keepMatch ? d.matchStats : undefined;
      return {
        ...d,
        cardType,
        matchId: keepMatch ? d.matchId : undefined,
        matchStats,
        rarity: computeDefaultRarity(cardType, matchStats ?? null, d.player),
      };
    });
  };

  const handleSelectTemplate = (template: Template) => {
    setData((d) => ({ ...d, templateId: template.id, template }));
  };

  const handleMatchSelect = async (matchId: string) => {
    if (!matchId) {
      setData((d) => ({
        ...d,
        matchId: undefined,
        matchStats: undefined,
        rarity: computeDefaultRarity(d.cardType, null, d.player),
      }));
      return;
    }
    const playerId = data.playerId;
    setData((d) => ({ ...d, matchId, matchStats: undefined }));
    setLoadingStats(true);
    try {
      const allStats = await getPlayerMatchStats(matchId);
      const matchStats = allStats.find((s) => s.playerId === playerId) ?? null;
      setData((d) =>
        d.playerId === playerId && d.matchId === matchId
          ? {
              ...d,
              matchStats: matchStats ?? undefined,
              rarity: computeDefaultRarity(d.cardType, matchStats, d.player),
            }
          : d
      );
    } catch (err) {
      console.warn("[CardGeneratorWizard] getPlayerMatchStats", err);
      toast.error("Statistiky zápasu se nepodařilo načíst.");
      setData((d) => ({ ...d, matchId: undefined, matchStats: undefined }));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerate = async () => {
    const firstInvalid = [0, 1, 2, 3].find((s) => stepError(s));
    if (firstInvalid !== undefined) {
      setStep(firstInvalid);
      setShowErrors(true);
      return;
    }
    if (!data.player) return;
    setGenerating(true);
    try {
      await onGenerate({
        playerId: data.playerId,
        playerName: data.player.displayName,
        cardType: data.cardType,
        rarity: data.rarity,
        templateId: data.templateId,
        templateStyle: data.template?.category,
        season: data.season.trim(),
        matchId: data.matchId,
        cardStats: buildCardStats(data.cardType, data.player, data.matchStats ?? null),
        shareSlug: generateShareSlug(),
        isPublic: false,
        effect: "none",
        aiStatus: "done",
        shareCount: 0,
        printCount: 0,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <StepBar current={step} />

      <div className="min-h-[360px]">
        {step === 0 && (
          <StepPlayer players={players} selectedId={data.playerId} onSelect={handleSelectPlayer} />
        )}
        {step === 1 && <StepCardType selected={data.cardType} onSelect={handleSelectCardType} />}
        {step === 2 && (
          <StepTemplate
            templates={templates}
            selectedId={data.templateId}
            isAllowed={isTemplateAllowed}
            locale={locale}
            player={data.player}
            sampleCard={
              {
                cardType: data.cardType,
                rarity: data.rarity,
                season: data.season.trim(),
                aiStatus: "done",
                cardStats: data.player
                  ? buildCardStats(data.cardType, data.player, data.matchStats ?? null)
                  : { overall: 50 },
              } as Card
            }
            onSelect={handleSelectTemplate}
          />
        )}
        {step === 3 && (
          <StepContent
            data={data}
            matches={playerMatches}
            locale={locale}
            showErrors={showErrors}
            seasonError={seasonError}
            onMatchSelect={handleMatchSelect}
            onSeasonChange={(season) => setData((d) => ({ ...d, season }))}
            onRarityChange={(rarity) => setData((d) => ({ ...d, rarity }))}
            loadingStats={loadingStats}
          />
        )}
        {step === 4 && <StepPreview data={data} generating={generating} />}
      </div>

      {currentError && (
        <div className="mt-6">
          <Notice tone="error">{currentError}</Notice>
        </div>
      )}

      <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="ghost" onClick={goBack} disabled={step === 0 || generating}>
          Zpět
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Pokračovat
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={generating}>
            {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Vytvořit kartičku
          </Button>
        )}
      </div>
    </div>
  );
}
