"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { IMAGE_ACCEPT } from "@/lib/media/file-types";
import { imageUrl } from "@/lib/media/urls";
import { GALLERY_MAX } from "@/lib/types";
import { MAX_MB } from "./FileField";
import { guessType, uploadFile } from "./upload";

/**
 * Photo gallery picker: several images at once, uploaded one after another. Photos can
 * be reordered or removed; `onChange` receives the storage paths in display order.
 */
export function GalleryField({ value, onChange, error }: { value: string[]; onChange: (paths: string[]) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const room = GALLERY_MAX - value.length;

  async function onPick(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setUploadError(null);
    const problems: string[] = [];
    if (files.length > room) problems.push(`Only ${room} more photo${room === 1 ? "" : "s"} fit (${GALLERY_MAX} max).`);
    const added: string[] = [];
    const chosen = files.slice(0, room);
    for (const [i, file] of chosen.entries()) {
      if (!(file.type || guessType(file.name)).startsWith("image/")) {
        problems.push(`${file.name}: not an image (use JPG, PNG, WebP or AVIF).`);
        continue;
      }
      if (file.size > MAX_MB.gallery * 1024 * 1024) {
        problems.push(`${file.name}: larger than ${MAX_MB.gallery} MB.`);
        continue;
      }
      try {
        added.push(await uploadFile("gallery", file, (pct) => setStatus(`Uploading photo ${i + 1} of ${chosen.length}… ${pct}%`)));
      } catch (err) {
        problems.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setStatus(null);
    if (problems.length) setUploadError(problems.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (i: number, by: number) => {
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };

  return (
    <div>
      <span className="label" id="gallery-label">Photo gallery <span className="text-muted">(optional, up to {GALLERY_MAX})</span></span>
      <div className={`rounded-2xl border border-dashed p-4 ${error || uploadError ? "border-red-400/60" : "border-line"} bg-night/40`}>
        {value.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4" data-testid="gallery-list">
            {value.map((p, i) => (
              <li key={p} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                <Image src={imageUrl(p)!} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-night/80 p-1">
                  <button type="button" className="rounded p-1 hover:bg-white/10 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} left`}>
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className="rounded p-1 text-red-300 hover:bg-white/10" onClick={() => onChange(value.filter((x) => x !== p))} aria-label={`Remove photo ${i + 1}`}>
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className="rounded p-1 hover:bg-white/10 disabled:opacity-30" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} right`}>
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id="gallery"
          type="file"
          multiple
          accept={IMAGE_ACCEPT}
          className="sr-only"
          aria-labelledby="gallery-label"
          onChange={(e) => void onPick(e.target.files)}
          disabled={!!status || room === 0}
          data-testid="gallery-input"
        />
        <label htmlFor="gallery" className={`btn-ghost cursor-pointer ${status || room === 0 ? "pointer-events-none opacity-60" : ""}`}>
          {status ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
          {room === 0 ? "Gallery is full" : "Add photos"}
        </label>
        {status && <p className="mt-2 text-xs text-muted" role="status">{status}</p>}
        <p className="mt-2 text-xs text-muted">Pick several at once. JPG, PNG, WebP or AVIF, up to {MAX_MB.gallery} MB each. Use the arrows to change the order.</p>
      </div>
      {(uploadError || error) && <p className="mt-1 text-sm text-red-300" role="alert">{uploadError || error}</p>}
    </div>
  );
}
