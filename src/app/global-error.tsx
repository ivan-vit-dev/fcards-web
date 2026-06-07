"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="cs">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          background: "#09090b",
          color: "#fafafa",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Fotbalové Kartičky
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            Aplikace narazila na neočekávanou chybu.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#854d0e",
              color: "#fef9c3",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Obnovit aplikaci
          </button>
        </div>
      </body>
    </html>
  );
}
