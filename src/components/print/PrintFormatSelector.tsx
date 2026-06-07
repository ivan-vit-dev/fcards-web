"use client";

import { cn } from "@/lib/utils";
import { PRINT_FORMATS, type PrintFormat } from "@/lib/printEngine";

interface Props {
  selected: PrintFormat;
  onSelect: (format: PrintFormat) => void;
  availableFormats: PrintFormat[];
}

function FormatDiagram({ cols, rows, cutMarks }: { cols: number; rows: number; cutMarks: boolean }) {
  const cellW = cols === 3 ? 14 : 20;
  const cellH = cols === 3 ? 20 : 28;
  const gap = 2;
  const totalW = cols * cellW + (cols - 1) * gap + 8;
  const totalH = rows * cellH + (rows - 1) * gap + 8;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full h-16 text-primary"
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = 4 + c * (cellW + gap);
          const y = 4 + r * (cellH + gap);
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x} y={y} width={cellW} height={cellH}
                rx="1"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
              {cutMarks && (
                <>
                  <line x1={x - 2} y1={y} x2={x - 0.5} y2={y} stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.6" />
                  <line x1={x} y1={y - 2} x2={x} y2={y - 0.5} stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.6" />
                  <line x1={x + cellW + 0.5} y1={y} x2={x + cellW + 2} y2={y} stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.6" />
                  <line x1={x + cellW} y1={y - 2} x2={x + cellW} y2={y - 0.5} stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.6" />
                </>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

export function PrintFormatSelector({ selected, onSelect, availableFormats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRINT_FORMATS.map((fmt) => {
        const available = availableFormats.includes(fmt.id);
        const isSelected = selected === fmt.id;

        return (
          <button
            key={fmt.id}
            type="button"
            onClick={() => available && onSelect(fmt.id)}
            disabled={!available}
            className={cn(
              "relative flex flex-col gap-2 p-3 rounded-xl border text-left transition-all",
              isSelected && available
                ? "border-primary bg-primary/8 shadow-sm"
                : available
                ? "border-border hover:border-primary/50 hover:bg-muted/40"
                : "border-dashed border-border/60 opacity-50 cursor-not-allowed bg-muted/20"
            )}
          >
            {!available && (
              <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                {fmt.requiresTier === "team" ? "Team" : "Premium"}
              </span>
            )}

            <FormatDiagram
              cols={fmt.cols}
              rows={fmt.rows}
              cutMarks={fmt.id === "sticker"}
            />

            <div>
              <p className="text-xs font-semibold leading-tight">{fmt.labelCs}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                {fmt.descriptionCs}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
