"use client";

import { useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { getPlayerMatchStats } from "@/lib/firebaseServices";
import type {
  Player,
  Team,
  Match,
  Template,
  Card,
  CardType,
  Rarity,
  PlayerMatchStats,
} from "@/types";

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
  userId: string;
  players: Player[];
  teams: Team[];
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

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
          <div
            className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                ? "bg-primary/20 text-primary border border-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={`text-xs hidden sm:block ${
              i === current ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px flex-1 mx-1 transition-colors ${
                i < current ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
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
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold">Vyber hráče</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vyberte hráče, pro kterého chcete vytvořit kartičku.
        </p>
      </div>
      <Input
        placeholder="Hledat hráče..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Žádní hráči nenalezeni.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {filtered.map((player) => {
            const initials = player.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const isSelected = player.id === selectedId;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelect(player)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/60 border border-transparent"
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={player.photoURL} />
                  <AvatarFallback className="font-display text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{player.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {positionLabels[player.position]}
                    {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
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
      <div>
        <h2 className="text-lg font-display font-bold">Typ kartičky</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Zvolte typ, který nejlépe vystihuje příležitost.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CARD_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`p-3 rounded-xl text-left transition-colors border ${
              selected === type
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "border-border hover:border-primary/20 hover:bg-muted/40"
            }`}
          >
            <p className="font-medium text-sm">{CARD_TYPE_LABELS[type]}</p>
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
  onSelect,
}: {
  templates: Template[];
  selectedId: string;
  onSelect: (t: Template) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold">Šablona</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vyberte vizuální šablonu pro kartičku.
        </p>
      </div>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Žádné šablony nejsou dostupné.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl)}
              className={`rounded-xl overflow-hidden border-2 transition-colors ${
                selectedId === tpl.id
                  ? "border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {tpl.previewURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tpl.previewURL}
                  alt={tpl.nameCs}
                  className="w-full aspect-[5/7] object-cover"
                />
              ) : (
                <div className="w-full aspect-[5/7] bg-muted flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center px-2">
                    {tpl.nameCs}
                  </p>
                </div>
              )}
              <div className="p-2 text-left">
                <p className="text-xs font-medium truncate">{tpl.nameCs}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5 h-4 px-1">
                  {tpl.requiredTier === "free" ? "Zdarma" : tpl.requiredTier}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Content ──────────────────────────────────────────────────────────

function StepContent({
  data,
  matches,
  onMatchSelect,
  onSeasonChange,
  onRarityChange,
  loadingStats,
}: {
  data: WizardData;
  matches: Match[];
  onMatchSelect: (matchId: string) => void;
  onSeasonChange: (season: string) => void;
  onRarityChange: (rarity: Rarity) => void;
  loadingStats: boolean;
}) {
  const needsMatch = data.cardType === "match" || data.cardType === "mvp";
  const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
  const rarityLabels: Record<string, string> = {
    common: "Běžná",
    uncommon: "Neobvyklá",
    rare: "Vzácná",
    epic: "Epická",
    legendary: "Legendární",
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-display font-bold">Obsah kartičky</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Nastavte statistiky a detaily pro kartičku.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Sezóna</Label>
        <Input
          value={data.season}
          onChange={(e) => onSeasonChange(e.target.value)}
          placeholder="2024/25"
        />
      </div>

      {needsMatch && (
        <div className="space-y-1.5">
          <Label>Zápas {data.cardType === "match" ? "(povinné)" : "(nepovinné)"}</Label>
          {matches.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Hráč nemá žádné zápasy. Statistiky budou prázdné.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => onMatchSelect("")}
                className={`w-full p-2.5 rounded-lg text-left text-sm border transition-colors ${
                  !data.matchId
                    ? "border-primary/40 bg-primary/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <span className="text-muted-foreground">Bez konkrétního zápasu</span>
              </button>
              {matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onMatchSelect(match.id)}
                  className={`w-full p-2.5 rounded-lg text-left border transition-colors ${
                    data.matchId === match.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      vs. {match.opponent}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {match.date}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {match.homeScore}:{match.awayScore}
                  </span>
                </button>
              ))}
            </div>
          )}
          {loadingStats && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Načítám statistiky...
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Vzácnost</Label>
        <div className="flex flex-wrap gap-2">
          {rarities.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRarityChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                data.rarity === r
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              {rarityLabels[r]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Automaticky navržena podle statistik. Můžete ručně upravit.
        </p>
      </div>
    </div>
  );
}

// ─── Step 5: Preview ──────────────────────────────────────────────────────────

function StepPreview({
  data,
  generating,
}: {
  data: WizardData;
  generating: boolean;
}) {
  if (!data.player) return null;

  const draftCard: Partial<Card> = {
    cardType: data.cardType,
    rarity: data.rarity,
    templateId: data.templateId,
    season: data.season,
    matchId: data.matchId,
    cardStats: buildCardStats(data.cardType, data.player, data.matchStats),
    aiStatus: "done",
    effect: "none",
    shareCount: 0,
    printCount: 0,
    isPublic: false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold">Náhled kartičky</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Zkontrolujte kartičku před vygenerováním.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <CardPreview
          card={draftCard as Card}
          player={data.player}
          template={data.template ?? undefined}
          size="lg"
        />

        <div className="space-y-4 flex-1">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Hráč
            </p>
            <p className="font-display font-bold">{data.player.displayName}</p>
            <p className="text-sm text-muted-foreground">
              {positionLabels[data.player.position]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Typ
            </p>
            <p className="text-sm">{CARD_TYPE_LABELS[data.cardType]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Vzácnost
            </p>
            <RarityBadge rarity={data.rarity} />
          </div>
          {data.season && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                Sezóna
              </p>
              <p className="text-sm">{data.season}</p>
            </div>
          )}
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
                  <div
                    key={label}
                    className="bg-muted/40 rounded-lg p-2 text-center"
                  >
                    <p className="font-display font-bold text-sm">{value}</p>
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
          Vytvářím kartičku...
        </div>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function CardGeneratorWizard({
  userId: _userId,
  players,
  teams,
  matches,
  templates,
  onGenerate,
}: CardGeneratorWizardProps) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const currentSeason = (() => {
    const y = new Date().getFullYear();
    return `${y}/${String(y + 1).slice(-2)}`;
  })();

  const [data, setData] = useState<WizardData>({
    playerId: "",
    player: null,
    cardType: "match",
    templateId: templates[0]?.id ?? "",
    template: templates[0] ?? null,
    season: currentSeason,
    rarity: "common",
  });

  const canNext = (): boolean => {
    if (step === 0) return !!data.playerId;
    if (step === 1) return !!data.cardType;
    if (step === 2) return !!data.templateId;
    return true;
  };

  const handleSelectPlayer = (player: Player) => {
    const rarity = computeDefaultRarity(data.cardType, null, player);
    setData((d) => ({ ...d, playerId: player.id, player, rarity }));
  };

  const handleSelectCardType = (cardType: CardType) => {
    const rarity = computeDefaultRarity(cardType, data.matchStats ?? null, data.player);
    setData((d) => ({ ...d, cardType, rarity }));
  };

  const handleSelectTemplate = (template: Template) => {
    setData((d) => ({ ...d, templateId: template.id, template }));
  };

  const handleMatchSelect = async (matchId: string) => {
    if (!matchId) {
      const rarity = computeDefaultRarity(data.cardType, null, data.player);
      setData((d) => ({ ...d, matchId: undefined, matchStats: undefined, rarity }));
      return;
    }
    setLoadingStats(true);
    try {
      const allStats = await getPlayerMatchStats(matchId);
      const matchStats = allStats.find((s) => s.playerId === data.playerId) ?? null;
      const rarity = computeDefaultRarity(data.cardType, matchStats, data.player);
      setData((d) => ({ ...d, matchId, matchStats: matchStats ?? undefined, rarity }));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerate = async () => {
    if (!data.player) return;
    setGenerating(true);
    try {
      const shareSlug = generateShareSlug();
      const cardStats = buildCardStats(data.cardType, data.player, data.matchStats ?? null);
      await onGenerate({
        playerId: data.playerId,
        cardType: data.cardType,
        rarity: data.rarity,
        templateId: data.templateId,
        season: data.season,
        matchId: data.matchId,
        cardStats,
        shareSlug,
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

  // Collect all matches for player's teams
  const playerTeamId = data.player?.teamId;
  const playerMatches = playerTeamId
    ? matches.filter(() =>
        teams.find((t) => t.id === playerTeamId) !== undefined
      )
    : [];

  return (
    <div>
      <StepBar current={step} />

      <div className="min-h-[360px]">
        {step === 0 && (
          <StepPlayer
            players={players}
            selectedId={data.playerId}
            onSelect={handleSelectPlayer}
          />
        )}
        {step === 1 && (
          <StepCardType selected={data.cardType} onSelect={handleSelectCardType} />
        )}
        {step === 2 && (
          <StepTemplate
            templates={templates}
            selectedId={data.templateId}
            onSelect={handleSelectTemplate}
          />
        )}
        {step === 3 && (
          <StepContent
            data={data}
            matches={playerMatches}
            onMatchSelect={handleMatchSelect}
            onSeasonChange={(season) => setData((d) => ({ ...d, season }))}
            onRarityChange={(rarity) => setData((d) => ({ ...d, rarity }))}
            loadingStats={loadingStats}
          />
        )}
        {step === 4 && <StepPreview data={data} generating={generating} />}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          Zpět
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
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
