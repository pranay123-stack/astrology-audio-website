import Link from "next/link";

export function LoadMore({ shown, total, href }: { shown: number; total: number; href: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        Showing {shown} of {total}
      </p>
      {shown < total && (
        <Link href={href} scroll={false} className="btn-ghost px-6" data-testid="load-more">
          Load more
        </Link>
      )}
    </div>
  );
}
