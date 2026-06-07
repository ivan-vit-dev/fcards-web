"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type EditorTab = "content" | "design" | "effects";

interface EditorToolbarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function EditorToolbar({ activeTab, onTabChange }: EditorToolbarProps) {
  const t = useTranslations("editor");

  const tabs: { key: EditorTab; label: string }[] = [
    { key: "content", label: t("content") },
    { key: "design", label: t("design") },
    { key: "effects", label: t("effects") },
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
