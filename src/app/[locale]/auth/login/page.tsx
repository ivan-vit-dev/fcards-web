"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLoginForm } from "@/hooks/use-auth-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { form, onSubmit, loginWithGoogle, loading } = useLoginForm();
  const locale = (useParams()?.locale as string) ?? "cs";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold font-display">Přihlásit se</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Přihlaste se ke svému účtu
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={loginWithGoogle}
        disabled={loading}
        type="button"
      >
        <GoogleIcon className="h-4 w-4" />
        Přihlásit se přes Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">nebo</span>
        </div>
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Heslo</Label>
            <Link
              href={`/${locale}/auth/reset`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Zapomenuté heslo?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Přihlašování..." : "Přihlásit se"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Nemáte účet?{" "}
        <Link
          href={`/${locale}/auth/register`}
          className="text-primary hover:underline font-medium"
        >
          Registrovat se
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
