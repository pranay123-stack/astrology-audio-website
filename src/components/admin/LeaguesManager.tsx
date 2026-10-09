"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteCompetition, deleteTeam, saveCompetition, saveTeam } from "@/app/admin/actions";
import { TeamBadge } from "@/components/episodes/TeamBadge";
import { imageUrl } from "@/lib/media/urls";
import type { Competition, Team } from "@/lib/types";
import { FileField } from "./FileField";

type Result = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<Result>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        const detail = r.fields ? Object.values(r.fields)[0] : undefined;
        setError(detail ? `${r.error} ${detail}` : r.error);
        return;
      }
      onOk?.();
      router.refresh();
    });
  };
  return { pending, error, run };
}

function TeamEditor({ competitionId, team, onDone }: { competitionId: string; team?: Team; onDone: () => void }) {
  const { pending, error, run } = useAction();
  const [name, setName] = useState(team?.name ?? "");
  const [short, setShort] = useState(team?.short_name ?? "");
  const [color, setColor] = useState(team?.primary_color ?? "#4c1d95");
  const [logo, setLogo] = useState<string | null>(team?.logo_path ?? null);
  const idp = team?.id ?? `new-${competitionId}`;
  return (
    <div className="space-y-4 rounded-xl border border-line bg-night/40 p-4" data-testid="team-editor">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <div>
          <label htmlFor={`${idp}-name`} className="label">Team name</label>
          <input id={`${idp}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${idp}-short`} className="label">Short code</label>
          <input id={`${idp}-short`} className="input uppercase" maxLength={6} value={short} onChange={(e) => setShort(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label htmlFor={`${idp}-color`} className="label">Colour</label>
          <input id={`${idp}-color`} type="color" className="h-[42px] w-16 cursor-pointer rounded-xl border border-line bg-transparent" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
      </div>
      <FileField
        id={`${idp}-logo`}
        kind="team"
        label="Logo (optional)"
        hint="Only upload logos you are licensed to use. Without a logo, a monogram in the team colour is shown."
        value={logo}
        previewUrl={imageUrl(team?.logo_path)}
        onChange={setLogo}
      />
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-gold"
          disabled={pending}
          onClick={() =>
            run(
              () => saveTeam({ id: team?.id, competition_id: competitionId, name, short_name: short, primary_color: color, logo_path: logo }),
              onDone,
            )
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save team
        </button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

function TeamRow({ team }: { team: Team }) {
  const [editing, setEditing] = useState(false);
  const { pending, error, run } = useAction();
  if (editing) return <li><TeamEditor competitionId={team.competition_id} team={team} onDone={() => setEditing(false)} /></li>;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-3">
        <TeamBadge team={team} size={36} />
        <span>
          <span className="font-medium">{team.name}</span> <span className="text-xs text-muted">{team.short_name}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
        <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)} aria-label={`Edit ${team.name}`}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className="btn-danger px-3 py-1.5 text-xs"
          disabled={pending}
          aria-label={`Delete ${team.name}`}
          onClick={() => window.confirm(`Delete ${team.name}?`) && run(() => deleteTeam(team.id))}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </li>
  );
}

function CompetitionForm({ competition, onDone }: { competition?: Competition; onDone: () => void }) {
  const { pending, error, run } = useAction();
  const [name, setName] = useState(competition?.name ?? "");
  const [short, setShort] = useState(competition?.short_name ?? "");
  const [description, setDescription] = useState(competition?.description ?? "");
  const idp = competition?.id ?? "new-comp";
  return (
    <div className="card space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor={`${idp}-name`} className="label">Competition name</label>
          <input id={`${idp}-name`} className="input" placeholder="e.g. Indian Premier League" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${idp}-short`} className="label">Short name</label>
          <input id={`${idp}-short`} className="input" placeholder="e.g. IPL" value={short} onChange={(e) => setShort(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor={`${idp}-desc`} className="label">Description</label>
        <input id={`${idp}-desc`} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-gold"
          disabled={pending}
          onClick={() => run(() => saveCompetition({ id: competition?.id, name, short_name: short, description, is_active: true }), onDone)}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save competition
        </button>
        <button type="button" className="btn-ghost" onClick={onDone}><X className="h-4 w-4" aria-hidden /> Cancel</button>
      </div>
    </div>
  );
}

function CompetitionCard({ competition, teams }: { competition: Competition; teams: Team[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const { pending, error, run } = useAction();
  if (editing) return <CompetitionForm competition={competition} onDone={() => setEditing(false)} />;
  return (
    <section className="card p-6" data-testid="competition-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{competition.name} <span className="text-base text-muted">({competition.short_name})</span></h2>
          {competition.description && <p className="text-sm text-muted">{competition.description}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>Edit</button>
          <button
            type="button"
            className="btn-danger px-3 py-1.5 text-xs"
            disabled={pending}
            onClick={() => window.confirm(`Delete ${competition.name}?`) && run(() => deleteCompetition(competition.id))}
          >
            Delete
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-red-300">{error}</p>}
      <ul className="divide-y divide-line">
        {teams.map((t) => <TeamRow key={t.id} team={t} />)}
        {teams.length === 0 && <li className="py-2 text-sm text-muted">No teams yet.</li>}
      </ul>
      <div className="mt-4">
        {adding ? (
          <TeamEditor competitionId={competition.id} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add team
          </button>
        )}
      </div>
    </section>
  );
}

export function LeaguesManager({ competitions, teams }: { competitions: Competition[]; teams: Team[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-6">
      {competitions.map((c) => (
        <CompetitionCard key={c.id} competition={c} teams={teams.filter((t) => t.competition_id === c.id)} />
      ))}
      {adding ? (
        <CompetitionForm onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Add competition (e.g. IPL)
        </button>
      )}
    </div>
  );
}
