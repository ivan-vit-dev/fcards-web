"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRarityColor } from "@/lib/utils";
import { CardPreview } from "./CardPreview";
import { RarityBadge } from "./RarityBadge";
import type { Card, Player } from "@/types";

type Phase = "pack" | "burst" | "card";

const RARITY_SHOUT: Record<Card["rarity"], string> = {
  common: "Nová kartička!",
  uncommon: "Neobvyklá kartička!",
  rare: "Vzácná kartička!",
  epic: "EPICKÁ kartička!",
  legendary: "LEGENDÁRNÍ!",
  mythic: "MÝTICKÁ!!!",
  limited: "LIMITOVANÁ EDICE!",
};

// Crimped foil edge, like the sealed top and bottom of a real booster pack.
const PACK_CLIP = `polygon(${Array.from({ length: 21 }, (_, i) => `${i * 5}% ${i % 2 ? 0 : 2.2}%`).join(", ")}, ${Array.from(
  { length: 21 },
  (_, i) => `${100 - i * 5}% ${i % 2 ? 100 : 97.8}%`
).join(", ")})`;

interface Props {
  card: Card;
  player?: Player;
  onDone: () => void;
  doneLabel?: string;
}

// Opening a booster pack: the pack shakes, tears open in a flash of the rarity colour and the
// new card flips into view. Tapping the pack skips the wait; reduced motion shows the card at once.
export function CardReveal({ card, player, onDone, doneLabel = "Zobrazit kartičku" }: Props) {
  const reduce = useReducedMotion();
  // Always start on the pack: the reduced-motion preference is only known in the browser,
  // so deciding it during render would mismatch server-rendered HTML.
  const [phase, setPhase] = useState<Phase>("pack");
  const [run, setRun] = useState(0);
  const color = getRarityColor(card.rarity);
  const big = card.rarity === "legendary" || card.rarity === "mythic" || card.rarity === "limited";

  useEffect(() => {
    if (phase === "pack") {
      const t = setTimeout(() => setPhase(reduce ? "card" : "burst"), reduce ? 0 : 1800);
      return () => clearTimeout(t);
    }
    if (phase === "burst") {
      const t = setTimeout(() => setPhase("card"), 700);
      return () => clearTimeout(t);
    }
  }, [phase, run, reduce]);

  // Close with Escape once the card is shown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && phase === "card" && onDone();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onDone]);

  const sparks = useMemo(
    () =>
      Array.from({ length: big ? 26 : 12 }, (_, i) => {
        const a = (i / (big ? 26 : 12)) * Math.PI * 2 + i;
        const dist = 160 + ((i * 37) % 120);
        return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, s: 4 + (i % 4) * 2, d: (i % 5) * 0.05 };
      }),
    [big]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rozbalení nové kartičky"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/85 backdrop-blur-sm"
      onClick={phase === "pack" ? () => setPhase("burst") : undefined}
    >
      {/* Rotating rays in the rarity colour */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: "170vmax",
          height: "170vmax",
          background: `repeating-conic-gradient(from 0deg, color-mix(in oklch, ${color} 30%, transparent) 0deg 7deg, transparent 7deg 20deg)`,
          maskImage: "radial-gradient(circle, black 0%, transparent 45%)",
        }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: phase === "pack" ? 0.25 : 1, rotate: 360 }}
        transition={{ opacity: { duration: 0.6 }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
      />

      <AnimatePresence mode="wait">
        {phase === "pack" && (
          <motion.div
            key={`pack-${run}`}
            className="relative cursor-pointer"
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              rotate: [0, -2, 2, -3, 3, -5, 5, -7, 7, -4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.7, rotate: { duration: 1.7, ease: "easeIn" } }}
          >
            <Pack color={color} season={card.season} />
            <p className="mt-6 text-center text-sm text-white/70">Klepni pro otevření</p>
          </motion.div>
        )}

        {phase === "burst" && (
          <motion.div key="burst" className="relative" style={{ width: 240, height: 340 }}>
            {/* Torn-off top strip flies away */}
            <motion.div
              className="absolute inset-x-0 top-0 overflow-hidden"
              style={{ height: "18%" }}
              initial={{ y: 0, rotate: 0, opacity: 1 }}
              animate={{ y: -320, rotate: -25, x: -60, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Pack color={color} season={card.season} />
            </motion.div>
            {/* The rest of the pack drops away */}
            <motion.div
              className="absolute inset-x-0 bottom-0 overflow-hidden"
              style={{ height: "82%" }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 380, opacity: 0, rotate: 6 }}
              transition={{ duration: 0.6, ease: "easeIn" }}
            >
              <div style={{ marginTop: "-22%" }}>
                <Pack color={color} season={card.season} />
              </div>
            </motion.div>
            {/* Flash */}
            <motion.div
              className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
              style={{
                width: 80,
                height: 80,
                translate: "-50% -50%",
                background: `radial-gradient(circle, white, color-mix(in oklch, ${color} 70%, white) 40%, transparent 70%)`,
              }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 18, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </motion.div>
        )}

        {phase === "card" && (
          <motion.div key={`card-${run}`} className="relative flex flex-col items-center" style={{ perspective: 1200 }}>
            {/* Sparks */}
            {!reduce &&
              sparks.map((s, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute left-1/2 top-[45%] rounded-full pointer-events-none"
                  style={{ width: s.s, height: s.s, background: i % 3 ? color : "white", boxShadow: `0 0 8px ${color}` }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.3 }}
                  transition={{ duration: 1.1, delay: 0.25 + s.d, ease: "easeOut" }}
                />
              ))}

            <motion.div
              initial={reduce ? false : { scale: 0.25, rotateY: 540, opacity: 0, y: 40 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 60, damping: 11 }}
            >
              <CardPreview card={card} player={player} size="lg" interactive />
            </motion.div>

            <motion.div
              className="mt-6 flex flex-col items-center gap-3"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <p
                className="font-display font-bold text-2xl tracking-wide text-white"
                style={{ textShadow: `0 0 18px ${color}` }}
              >
                {RARITY_SHOUT[card.rarity]}
              </p>
              <RarityBadge rarity={card.rarity} variant="solid" />
              <div className="flex gap-2 pt-2">
                {!reduce && (
                  <Button
                    variant="outline"
                    className="gap-1.5 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setRun((r) => r + 1);
                      setPhase("pack");
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rozbalit znovu
                  </Button>
                )}
                <Button onClick={onDone} autoFocus>
                  {doneLabel}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pack({ color, season }: { color: string; season?: string }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 240,
        height: 340,
        clipPath: PACK_CLIP,
        background: `linear-gradient(135deg, color-mix(in oklch, ${color} 80%, white), color-mix(in oklch, ${color} 55%, black) 45%, color-mix(in oklch, ${color} 85%, white) 70%, color-mix(in oklch, ${color} 50%, black))`,
        boxShadow: `0 0 40px color-mix(in oklch, ${color} 60%, transparent)`,
      }}
    >
      {/* Foil sheen sweeping across */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(110deg, transparent 30%, oklch(1 0 0 / 0.55) 48%, transparent 66%)" }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Crimp lines */}
      <div className="absolute inset-x-0 top-[6%] h-px bg-white/40" />
      <div className="absolute inset-x-0 bottom-[6%] h-px bg-white/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
        <span className="text-6xl drop-shadow-lg" aria-hidden>
          ⚽
        </span>
        <p className="font-display font-bold text-xl tracking-[0.2em] text-center leading-tight drop-shadow">
          FOTBALOVÉ
          <br />
          KARTIČKY
        </p>
        {season && <p className="text-[10px] tracking-[0.3em] text-white/80">SEZÓNA {season}</p>}
      </div>
    </div>
  );
}
