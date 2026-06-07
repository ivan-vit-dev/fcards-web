import type { ReactNode } from "react";

// Root layout is minimal — locale layout (app/[locale]/layout.tsx) owns html/body/providers.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
