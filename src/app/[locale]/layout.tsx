import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Inter, Oswald } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Fotbalové Kartičky",
    template: "%s | Fotbalové Kartičky",
  },
  description:
    "Personalizované fotbalové kartičky pro hráče, týmy a kluby. Generuj, sbírej a sdílej.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FKartičky",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#854d0e",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "cs" | "en")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  className:
                    "!bg-card !text-card-foreground !border !border-border !rounded-lg !text-sm",
                  duration: 4000,
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
