"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useResetForm } from "@/hooks/use-auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

export default function ResetPage() {
  const { form, onSubmit, loading, sent } = useResetForm();
  const locale = (useParams()?.locale as string) ?? "cs";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-xl font-bold font-display">E-mail odeslán</h1>
        <p className="text-muted-foreground text-sm">
          Zkontrolujte svou e-mailovou schránku a postupujte podle pokynů pro
          obnovení hesla.
        </p>
        <Link href={`/${locale}/auth/login`}>
          <Button variant="outline" className="mt-2">
            Zpět na přihlášení
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold font-display">Zapomenuté heslo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zašleme vám odkaz pro obnovení hesla
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vas@email.cz"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Odesílání..." : "Odeslat odkaz"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={`/${locale}/auth/login`}
          className="text-primary hover:underline font-medium"
        >
          ← Zpět na přihlášení
        </Link>
      </p>
    </div>
  );
}
