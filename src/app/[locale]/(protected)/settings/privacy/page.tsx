"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { ArrowLeft, Download, FileText, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { deleteMyAccount, exportMyData, getUserDoc, setAIConsent } from "@/lib/firebaseServices";
import { AI_PROCESSORS, hasAIConsent } from "@/lib/legal";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CONFIRM_WORD = "SMAZAT";

// Consents written with serverTimestamp() are a sentinel until re-read from Firestore.
function formatTs(ts?: Timestamp): string | null {
  return ts && typeof ts.toDate === "function" ? ts.toDate().toLocaleDateString("cs-CZ") : null;
}

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacySettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const locale = (useParams()?.locale as string) ?? "cs";
  const [savingAI, setSavingAI] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;
  const consents = user.consents;
  const aiOn = hasAIConsent(user);

  const toggleAI = async (on: boolean) => {
    setSavingAI(true);
    try {
      await setAIConsent(user.uid, on);
      const fresh = await getUserDoc(user.uid);
      if (fresh) setUser(fresh);
      toast.success(on ? "Souhlas s AI úpravami udělen." : "Souhlas s AI úpravami odvolán.");
    } catch (err) {
      console.warn("[Privacy] AI consent", err);
      toast.error("Změnu se nepodařilo uložit.");
    } finally {
      setSavingAI(false);
    }
  };

  const download = async () => {
    setExporting(true);
    try {
      const data = await exportMyData(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fotbalove-karticky-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("[Privacy] export", err);
      toast.error("Data se nepodařilo stáhnout.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await signOut(auth).catch(() => undefined); // the login no longer exists
      logout();
      toast.success("Účet a všechna data byla smazána.");
      router.replace(`/${locale}`);
    } catch (err) {
      console.warn("[Privacy] delete account", err);
      toast.error("Účet se nepodařilo smazat. Zkuste to znovu, případně nás kontaktujte.");
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-5">
      <div>
        <Link
          href={`/${locale}/settings`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Nastavení
        </Link>
        <h1 className="text-xl font-bold mt-2">Soukromí a účet</h1>
        <p className="text-sm text-muted-foreground mt-1">Souhlasy, vaše data a smazání účtu</p>
      </div>

      <Section icon={FileText} title="Dokumenty">
        <div className="flex flex-col gap-1.5 text-sm">
          <Link href={`/${locale}/legal/privacy`} className="text-primary hover:underline">
            Zásady ochrany osobních údajů
          </Link>
          <Link href={`/${locale}/legal/terms`} className="text-primary hover:underline">
            Podmínky použití
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {consents?.termsVersion
            ? `Přijato ${formatTs(consents.termsAcceptedAt) ?? "dnes"} (verze ${consents.termsVersion}) · ${
                consents.age === "guardian" ? "účet spravuje rodič / zákonný zástupce" : "uživatel 15+"
              }`
            : "Zatím nepřijato."}
        </p>
      </Section>

      <Section icon={Sparkles} title="Úpravy fotek pomocí AI">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Pro AI Studio se fotky posílají službám{" "}
            {AI_PROCESSORS.map((p) => p.name.split(" (")[0]).join(", ")}. Bez souhlasu AI Studio nefunguje,
            vše ostatní ano.
          </p>
          <Switch checked={aiOn} disabled={savingAI} onCheckedChange={toggleAI} aria-label="Souhlas s AI úpravami" />
        </div>
        {aiOn && (
          <p className="text-xs text-muted-foreground">Souhlas udělen {formatTs(consents?.aiPhotosAt) ?? "dnes"}.</p>
        )}
      </Section>

      <Section icon={Download} title="Moje data">
        <p className="text-sm text-muted-foreground">
          Stáhněte si kopii všeho, co o vás aplikace ukládá: účet, hráče, kartičky, týmy a úspěchy (soubor JSON s
          odkazy na fotky).
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={download} disabled={exporting}>
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Připravuji…" : "Stáhnout moje data"}
        </Button>
      </Section>

      <Section icon={Trash2} title="Smazat účet">
        <p className="text-sm text-muted-foreground">
          Trvale smaže účet, všechny hráče, kartičky, fotky a AI úpravy, týmy, které trénujete, a jejich zápasy.
          Tuto akci nelze vrátit.
        </p>
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Smazat účet
        </Button>
      </Section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Kartičky, které jste si stáhli nebo vytiskli, smazání neovlivní.
      </p>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (deleting) return;
          setDeleteOpen(o);
          setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu smazat účet?</AlertDialogTitle>
            <AlertDialogDescription render={<div />} className="space-y-3 text-left">
              <p>
                Smaže se všechno, včetně fotek a sdílených odkazů. Pro potvrzení napište{" "}
                <strong className="text-foreground">{CONFIRM_WORD}</strong>.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
                disabled={deleting}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Zrušit</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
              onClick={deleteAccount}
            >
              {deleting ? "Mažu…" : "Smazat natrvalo"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
