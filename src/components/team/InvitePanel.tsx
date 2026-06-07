"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface InvitePanelProps {
  teamId: string;
  locale: string;
}

export function InvitePanel({ teamId, locale }: InvitePanelProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/teams/${teamId}`
      : `/${locale}/teams/${teamId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Odkaz zkopírován!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopírování se nezdařilo.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <QRCodeSVG value={inviteUrl} size={160} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 font-mono text-muted-foreground truncate min-w-0"
        />
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Zkopírováno" : "Kopírovat"}
        </Button>
      </div>
    </div>
  );
}
