import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { siteConfig } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm space-y-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="h-12 w-12" />
          <h1 className="text-3xl font-semibold">Admin sign in</h1>
          <p className="text-sm text-muted">{siteConfig.name}</p>
        </div>
        <LoginForm />
        <Link href="/" className="block text-center text-sm text-muted hover:text-gold-soft">← Back to the website</Link>
      </div>
    </main>
  );
}
