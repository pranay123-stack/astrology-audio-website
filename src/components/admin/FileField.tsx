"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { AUDIO_ACCEPT, IMAGE_ACCEPT, VIDEO_ACCEPT } from "@/lib/media/file-types";
import { guessType, readAudioDuration, uploadFile, type UploadKind } from "./upload";

export const MAX_MB: Record<UploadKind, number> = {
  audio: Number(process.env.NEXT_PUBLIC_MAX_AUDIO_UPLOAD_MB || 200),
  video: Number(process.env.NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB || 50),
  cover: 5,
  gallery: 5,
  team: 5,
  profile: 5,
};

/**
 * File picker that uploads immediately and reports the stored path through `onChange`.
 * `previewUrl` is the URL of the file that is currently saved (for edit forms).
 */
export function FileField({
  id,
  kind,
  label,
  hint,
  value,
  previewUrl,
  onChange,
  onDuration,
  onUploaded,
  error,
}: {
  id: string;
  kind: UploadKind;
  label: string;
  hint?: string;
  value: string | null;
  previewUrl: string | null;
  onChange: (path: string | null) => void;
  onDuration?: (seconds: number) => void;
  /** Called with the original file after it uploaded successfully. */
  onUploaded?: (file: File) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const isAudio = kind === "audio";
  const isVideo = kind === "video";
  const isImage = !isAudio && !isVideo;

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    const type = file.type || guessType(file.name);
    if (!type.startsWith(isAudio ? "audio/" : isVideo ? "video/" : "image/")) {
      setUploadError(
        isAudio ? "Choose an audio file (MP3, M4A, AAC, OGG or WAV)." : isVideo ? "Choose a video (MP4, WebM or MOV)." : "Choose an image (JPG, PNG, WebP or AVIF).",
      );
      return;
    }
    if (file.size > MAX_MB[kind] * 1024 * 1024) {
      setUploadError(`File is too large. The limit is ${MAX_MB[kind]} MB.`);
      return;
    }
    if (isAudio && onDuration) {
      const seconds = await readAudioDuration(file);
      if (seconds === null) {
        setUploadError("This browser could not read the audio file. Check that it is a valid audio file.");
        return;
      }
      onDuration(seconds);
    }
    setFileName(file.name);
    setLocalPreview(URL.createObjectURL(file));
    setProgress(0);
    try {
      const path = await uploadFile(kind, file, setProgress);
      onChange(path);
      onUploaded?.(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setLocalPreview(null);
      setFileName(null);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shown = localPreview ?? (value ? previewUrl : null);
  const uploading = progress !== null;

  return (
    <div>
      <span className="label" id={`${id}-label`}>{label}</span>
      <div className={`rounded-2xl border border-dashed p-4 ${error || uploadError ? "border-red-400/60" : "border-line"} bg-night/40`}>
        {shown && isImage && (
          <div className="relative mb-3 aspect-square w-40 overflow-hidden rounded-xl border border-line">
            <Image src={shown} alt="Preview" fill sizes="160px" className="object-cover" unoptimized={shown.startsWith("blob:")} />
          </div>
        )}
        {shown && isAudio && (
          // Preview before publishing: plays the local file, or the saved file via the admin-authorised audio route.
          <audio controls preload="metadata" src={shown} className="mb-3 w-full" data-testid="admin-audio-preview" />
        )}
        {shown && isVideo && (
          <video controls preload="metadata" playsInline src={shown} className="mb-3 max-h-80 rounded-xl bg-black" data-testid="admin-video-preview" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={isAudio ? AUDIO_ACCEPT : isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT}
            className="sr-only"
            aria-labelledby={`${id}-label`}
            onChange={(e) => onPick(e.target.files?.[0])}
            disabled={uploading}
            data-testid={`${id}-input`}
          />
          <label htmlFor={id} className={`btn-ghost cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {value ? "Replace file" : "Choose file"}
          </label>
          {value && !uploading && (
            <button type="button" className="btn-ghost" onClick={() => { onChange(null); setLocalPreview(null); setFileName(null); }}>
              <X className="h-4 w-4" aria-hidden /> Remove
            </button>
          )}
          {value && !uploading && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300" data-testid={`${id}-ready`}>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {fileName ? `Uploaded ${fileName}` : "File attached"}
            </span>
          )}
        </div>
        {uploading && (
          <div className="mt-3" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">Uploading… {progress}%</p>
          </div>
        )}
        {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      </div>
      {(uploadError || error) && <p className="mt-1 text-sm text-red-300" role="alert">{uploadError || error}</p>}
    </div>
  );
}
