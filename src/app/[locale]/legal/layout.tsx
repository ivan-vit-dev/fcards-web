import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { LegalFooter } from "@/components/legal/LegalFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        <article className="legal-doc space-y-4 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a:hover]:underline">
          {children}
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
