import type { CardTeam } from "@/types";

const HEX = /^#[0-9a-f]{6}$/i;

function crestInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(fc|fk|sk|tj|sc|ac|1\.)$/i.test(w));
  const src = words.length ? words : name.split(/\s+/);
  return src
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// The team's logo in a round badge, or — when no logo was uploaded — a shield in the
// team colour with its initials, so every card still gets a club crest.
export function TeamCrest({ team, fallbackColor, style }: { team: CardTeam; fallbackColor: string; style?: React.CSSProperties }) {
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logoUrl}
        alt={team.name}
        title={team.name}
        className="rounded-full bg-white object-contain"
        style={{ padding: "0.08em", ...style }}
      />
    );
  }
  const color = team.color && HEX.test(team.color) ? team.color : fallbackColor;
  return (
    <svg viewBox="0 0 24 28" style={style} role="img" aria-label={team.name}>
      <title>{team.name}</title>
      <path d="M12 1 22 4.5v9.2c0 6-4.2 10.6-10 13.3C6.2 24.3 2 19.7 2 13.7V4.5z" fill={color} stroke="white" strokeWidth="1.4" />
      <path d="M12 3.2 20 6v3H4V6z" fill="white" fillOpacity="0.22" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="white" fontFamily="var(--font-display), sans-serif">
        {crestInitials(team.name)}
      </text>
    </svg>
  );
}
