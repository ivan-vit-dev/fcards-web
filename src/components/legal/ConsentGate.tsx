"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { acceptTerms } from "@/lib/firebaseServices";
import { LEGAL_VERSION } from "@/lib/legal";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { ConsentFields, consentError, type AgeChoice } from "./ConsentFields";

/**
 * Shown instead of the app until the user has accepted the current terms: accounts created
 * through Google sign-in, accounts from before consents existed, and after LEGAL_VERSION changes.
 */
export function ConsentGate() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const locale = (useParams()?.locale as string) ?? "cs";
  const [age, setAge] = useState<AgeChoice | null>(user?.consents?.age ?? null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const updated = !!user?.consents?.termsVersion;

  if (!user) return null;

  const submit = async () => {
    const err = consentError(age, terms);
    setError(err);
    if (err || !age || age === "under15") return;
    setSaving(true);
    try {
      await acceptTerms(user.uid, age, LEGAL_VERSION);
      setUser({
        ...user,
        consents: { ...user.consents, termsVersion: LEGAL_VERSION, termsAcceptedAt: Timestamp.now(), age },
      });
    } catch (e) {
      console.warn("[ConsentGate]", e);
      toast.error("Souhlas se nepodařilo uložit. Zkuste to znovu.");
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    await signOut(auth);
    logout();
    router.push(`/${locale}/auth/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display">
            {updated ? "Aktualizovali jsme podmínky" : "Ještě jeden krok"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {updated
              ? "Než budete pokračovat, přečtěte si prosím nové podmínky a zásady ochrany osobních údajů."
              : "Aplikaci používají i děti, proto potřebujeme vědět, kdo účet spravuje, a váš souhlas s podmínkami."}
          </p>
        </div>

        <ConsentFields
          age={age}
          onAge={(a) => {
            setAge(a);
            setError(null);
          }}
          terms={terms}
          onTerms={(t) => {
            setTerms(t);
            setError(null);
          }}
          error={error ?? undefined}
        />

        <div className="space-y-2">
          <Button className="w-full" onClick={submit} disabled={saving || age === "under15"}>
            {saving ? "Ukládání…" : "Pokračovat"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={leave}>
            Odhlásit se
          </Button>
        </div>
      </div>
    </div>
  );
}
