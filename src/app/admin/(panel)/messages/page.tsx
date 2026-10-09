import type { Metadata } from "next";
import { deleteMessage, setMessageRead } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository } from "@/lib/data";
import { formatDateTime } from "@/lib/dates";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Messages" };

/** The session check and data reads happen inside Suspense, so the admin shell renders immediately. */
export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}>
      <MessagesContent />
    </Suspense>
  );
}

async function MessagesContent() {
  await requireAdmin();
  const messages = await (await getAdminRepository()).listContactMessages();
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-4xl font-semibold">Messages</h1>
      <p className="text-sm text-muted">Messages sent through the contact form. Reply from your own email client.</p>
      {messages.length === 0 && <div className="card p-10 text-center text-muted">No messages yet.</div>}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className={`card p-5 ${m.is_read ? "opacity-75" : "border-gold/40"}`} data-testid="message">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {!m.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold" aria-label="Unread" />}
                  {m.subject || "(no subject)"}
                </p>
                <p className="text-sm text-muted">
                  {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-gold-soft underline">{m.email}</a> ·{" "}
                  {formatDateTime(m.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <ActionButton action={setMessageRead.bind(null, m.id, !m.is_read)} className="btn-ghost px-3 py-1.5 text-xs">
                  Mark {m.is_read ? "unread" : "read"}
                </ActionButton>
                <ActionButton action={deleteMessage.bind(null, m.id)} confirmMessage="Delete this message?" className="btn-danger px-3 py-1.5 text-xs">
                  Delete
                </ActionButton>
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-line text-ink/90">{m.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
