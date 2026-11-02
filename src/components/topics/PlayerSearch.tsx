"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { searchByName } from "@/lib/name-search";
import type { Locale } from "@/lib/types";

/** Players' cards, narrowed to the name being typed. */
export function PlayerSearch({ players, lang }: { players: { id: string; name: string; card: ReactNode }[]; lang: Locale }) {
  const labels = getDict(lang).topics.players;
  const [query, setQuery] = useState("");
  const shown = useMemo(() => searchByName(players, (p) => p.name, query), [players, query]);
  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
          autoComplete="off"
          className="input pr-11 pl-12 [&::-webkit-search-cancel-button]:hidden"
          data-testid="player-search"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label={labels.clear} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="text-sm text-muted" aria-live="polite" data-testid="player-count">
        {query.trim() ? (shown.length ? labels.found(shown.length, players.length) : labels.none) : ""}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="topic-posts">
        {shown.map((p) => (
          <div key={p.id} className="contents">{p.card}</div>
        ))}
      </div>
    </div>
  );
}
