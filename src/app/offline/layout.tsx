import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Oswald } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "@/app/globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Offline | Fotbalové Kartičky",
};

// Outside [locale] on purpose: the service worker precaches the bare /offline path.
export default function OfflineLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
