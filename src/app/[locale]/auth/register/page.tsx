"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRegisterForm } from "@/hooks/use-auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { form, onSubmit, loading } = useRegisterForm();
  const locale = (useParams()?.locale as string) ?? "cs";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold font-display">Vytvořit účet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Začněte sbírat své fotbalové kartičky
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Jméno</Label>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Jan Novák"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-destructive text-xs">{errors.displayName.message}</p>
          )}
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Heslo</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimálně 6 znaků"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Vytváření účtu..." : "Registrovat se"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Již máte účet?{" "}
        <Link
          href={`/${locale}/auth/login`}
          className="text-primary hover:underline font-medium"
        >
          Přihlásit se
        </Link>
      </p>
    </div>
  );
}
