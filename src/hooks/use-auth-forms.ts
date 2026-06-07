"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { createUserDoc, getUserDoc } from "@/lib/firebaseServices";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseErrorMessage } from "@/lib/utils";

function useLocale() {
  const params = useParams();
  return (params?.locale as string) ?? "cs";
}

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  password: z.string().min(6, "Minimálně 6 znaků"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, values.email, values.password);
      const userDoc = await getUserDoc(cred.user.uid);
      setUser(userDoc);
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      toast.error(getFirebaseErrorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      let userDoc = await getUserDoc(cred.user.uid);
      if (!userDoc) {
        userDoc = await createUserDoc(cred.user.uid, {
          email: cred.user.email ?? "",
          displayName: cred.user.displayName ?? "",
          photoURL: cred.user.photoURL ?? undefined,
        });
      }
      setUser(userDoc);
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      toast.error(getFirebaseErrorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return { form, onSubmit, loginWithGoogle, loading };
}

// ─── Register ─────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    displayName: z.string().min(2, "Minimálně 2 znaky"),
    email: z.string().email("Neplatný e-mail"),
    password: z.string().min(6, "Minimálně 6 znaků"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Hesla se neshodují",
    path: ["confirmPassword"],
  });
type RegisterValues = z.infer<typeof registerSchema>;

export function useRegisterForm() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(cred.user, { displayName: values.displayName });
      const userDoc = await createUserDoc(cred.user.uid, {
        email: values.email,
        displayName: values.displayName,
      });
      // Set user immediately before redirect to avoid AppShell auth flicker
      setUser(userDoc);
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      toast.error(getFirebaseErrorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return { form, onSubmit, loading };
}

// ─── Reset password ───────────────────────────────────────────────────────────

const resetSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
});
type ResetValues = z.infer<typeof resetSchema>;

export function useResetForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSent(true);
      toast.success("E-mail pro obnovení hesla byl odeslán.");
    } catch (err: unknown) {
      toast.error(getFirebaseErrorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return { form, onSubmit, loading, sent };
}
