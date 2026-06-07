"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  filename?: string;
}

export function QRCodePanel({ url, filename = "qr-karticky" }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${filename}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={canvasRef}
        className="p-3 bg-white rounded-xl shadow-sm border border-border"
      >
        <QRCodeCanvas
          value={url}
          size={160}
          level="M"
          includeMargin={false}
          fgColor="#18181b"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Naskenujte QR kód pro zobrazení kartičky
      </p>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
        <Download className="h-3.5 w-3.5" />
        Stáhnout QR kód
      </Button>
    </div>
  );
}
