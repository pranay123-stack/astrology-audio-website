"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (result.ok) {
        router.replace("/admin");
        router.refresh();
      } else setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5" data-testid="login-form">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" data-testid="login-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn-gold w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
        Sign in
      </button>
    </form>
  );
}
