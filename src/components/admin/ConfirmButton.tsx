"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

type Result = { ok: true } | { ok: false; error: string };

/** Runs a server action after an optional confirmation, then refreshes the page. */
export function ActionButton({
  action,
  confirmMessage,
  children,
  className = "btn-ghost",
  testId,
}: {
  action: () => Promise<Result | ({ ok: true } & Record<string, unknown>)>;
  confirmMessage?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        data-testid={testId}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError((result as { error: string }).error);
            router.refresh();
          });
        }}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
