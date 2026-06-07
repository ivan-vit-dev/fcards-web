import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Sparkles,
  Printer,
  Trophy,
  Zap,
  Star,
  Users,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Kartičky ze zápasů",
    description: "Generuj personalizované kartičky z reálných statistik každého zápasu.",
  },
  {
    icon: Sparkles,
    title: "AI Studio",
    description: "Nechej umělou inteligenci vytvořit unikátní vizuální styl tvé kartičky.",
  },
  {
    icon: Printer,
    title: "Tisk na fyzické kartičky",
    description: "Exportuj své kartičky v tiskové kvalitě a vytiskni si je doma.",
  },
  {
    icon: Trophy,
    title: "Úspěchy & XP",
    description: "Sbírej úspěchy, získávej XP a postupuj na vyšší úrovně.",
  },
  {
    icon: Zap,
    title: "Vzácnostní systém",
    description: "Od Common po Mythic — každá kartička má svou raritu a unikátní efekty.",
  },
  {
    icon: Users,
    title: "Týmy & Kluby",
    description: "Spravuj celý tým a generuj kartičky pro všechny hráče najednou.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-2">
            <Star className="h-3 w-3" />
            Česká fotbalová platforma
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Tvoje fotbalové{" "}
            <span className="gradient-text">kartičky</span>,
            <br />
            tvůj příběh
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Generuj personalizované sběratelské kartičky z reálných statistik
            zápasů. Pro hráče, rodiče, trenéry a kluby.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/cs/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Začít zdarma
              </Button>
            </Link>
            <Link href="/cs/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Přihlásit se
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">
              Vše co potřebuješ
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Kompletní platforma pro správu a tvorbu fotbalových kartiček
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold mb-3">Plány a ceny</h2>
          <p className="text-muted-foreground mb-10">
            Začněte zdarma, upgradujte podle potřeby
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zdarma</p>
                <p className="text-3xl font-display font-bold">0 Kč</p>
                <p className="text-xs text-muted-foreground mt-1">navždy</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 20 kartiček měsíčně</li>
                <li>✓ Základní šablony</li>
                <li>✓ Sdílení na sociálních sítích</li>
                <li>✓ 1 hráčský profil</li>
              </ul>
              <Link href="/cs/auth/register">
                <Button variant="outline" className="w-full">Začít zdarma</Button>
              </Link>
            </div>
            {/* Premium */}
            <div className="bg-card border-2 border-primary rounded-2xl p-6 text-left space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Nejoblíbenější
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium</p>
                <p className="text-3xl font-display font-bold">149 Kč</p>
                <p className="text-xs text-muted-foreground mt-1">měsíčně</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Neomezené kartičky</li>
                <li>✓ AI Studio (50 kreditů/měsíc)</li>
                <li>✓ HD export pro tisk</li>
                <li>✓ Všechny šablony</li>
                <li>✓ Neomezené profily</li>
              </ul>
              <Link href="/cs/auth/register">
                <Button className="w-full">Vyzkoušet Premium</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© 2025 Fotbalové Kartičky. Všechna práva vyhrazena.</p>
      </footer>
    </div>
  );
}
