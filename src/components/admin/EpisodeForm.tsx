"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { saveEpisode } from "@/app/admin/actions";
import { categoriesByMenu, type AdminSlot, type PostField } from "@/lib/admin-site";
import { formatDuration, fromZonedInputValue, toZonedInputValue } from "@/lib/dates";
import { audioUrl, documentUrl, imageUrl, videoUrl } from "@/lib/media/urls";
import { parseDriveLink } from "@/lib/media/drive-link";
import { parseVideoLink } from "@/lib/media/video-link";
import { slugify } from "@/lib/slug";
import { MATCH_STATUSES, type ArticleLang, type VideoFormat, type Category, type Competition, type EpisodeListing, type Team } from "@/lib/types";
import { episodeInputSchema, fieldErrors, type EpisodeInput } from "@/lib/validation";
import { ArticleBody } from "@/components/episodes/ArticleBody";
import { FileField } from "./FileField";
import { GalleryField } from "./GalleryField";
import { captureVideoFrame, uploadFile } from "./upload";

interface FormValues {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  article: string;
  article_lang: ArticleLang;
  title_alt: string;
  excerpt_alt: string;
  description_alt: string;
  article_alt: string;
  category_id: string;
  duration_minutes: number;
  duration_secs: number;
  is_published: boolean;
  is_premium: boolean;
  published_at_local: string;
  competition_id: string;
  team_a_id: string;
  team_b_id: string;
  match_date_local: string;
  venue: string;
  match_status: (typeof MATCH_STATUSES)[number];
  video_format: VideoFormat;
  video_link: string;
  audio_link: string;
  pdf_link: string;
  is_archived: boolean;
}

export function EpisodeForm({
  episode,
  categories,
  competitions,
  teams,
  timeZone,
  slot,
}: {
  episode: EpisodeListing | null;
  categories: Category[];
  competitions: Competition[];
  teams: Team[];
  timeZone: string;
  /** Adding to one place on the website: pre-filled, with only the fields that place uses. */
  slot?: AdminSlot & { section: { key: string; title: string } };
}) {
  const router = useRouter();
  const [allFields, setAllFields] = useState(false);
  const show = (field: PostField) => !slot || allFields || slot.add.fields.includes(field);
  const [pending, startTransition] = useTransition();
  const [audioPath, setAudioPath] = useState<string | null>(episode?.audio_storage_path ?? null);
  const [coverPath, setCoverPathState] = useState<string | null>(episode?.cover_image_path ?? null);
  // Read inside async upload callbacks, which would otherwise see a stale value.
  const coverRef = useRef(coverPath);
  const setCoverPath = (p: string | null) => {
    coverRef.current = p;
    setCoverPathState(p);
  };
  const [thumbNote, setThumbNote] = useState<string | null>(null);

  /** A video was uploaded: if the post has no cover yet, use a still from the video. */
  async function coverFromVideo(file: File) {
    if (coverRef.current) return;
    setThumbNote("Taking a thumbnail from the video…");
    const still = await captureVideoFrame(file);
    if (!still || coverRef.current) return setThumbNote(null);
    try {
      setCoverPath(await uploadFile("cover", still, () => {}));
      setThumbNote("Cover image taken from the video. Upload your own below to replace it.");
    } catch {
      setThumbNote(null);
    }
  }
  const [videoPath, setVideoPath] = useState<string | null>(episode?.video_storage_path ?? null);
  const [galleryPaths, setGalleryPaths] = useState<string[]>(episode?.gallery_paths ?? []);
  const [pdfPath, setPdfPath] = useState<string | null>(episode?.pdf_storage_path ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!episode);

  const duration = episode?.duration_seconds ?? 0;
  const { register, control, setValue, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      title: episode?.title ?? "",
      slug: episode?.slug ?? "",
      excerpt: episode?.excerpt ?? "",
      description: episode?.description ?? "",
      article: episode?.article ?? "",
      article_lang: episode?.article_lang ?? slot?.add.lang ?? "hi",
      title_alt: episode?.title_alt ?? "",
      excerpt_alt: episode?.excerpt_alt ?? "",
      description_alt: episode?.description_alt ?? "",
      article_alt: episode?.article_alt ?? "",
      category_id: episode?.category_id ?? categories.find((c) => c.slug === slot?.add.category)?.id ?? "",
      duration_minutes: Math.floor(duration / 60),
      duration_secs: duration % 60,
      is_published: episode?.is_published ?? !!slot,
      is_premium: episode?.is_premium ?? false,
      published_at_local: toZonedInputValue(episode?.published_at, timeZone),
      competition_id: episode?.match?.competition_id ?? competitions.find((c) => c.slug === slot?.add.competition)?.id ?? competitions[0]?.id ?? "",
      team_a_id: episode?.match?.team_a_id ?? "",
      team_b_id: episode?.match?.team_b_id ?? "",
      match_date_local: toZonedInputValue(episode?.match?.match_date, timeZone),
      venue: episode?.match?.venue ?? "",
      match_status: episode?.match?.match_status ?? "scheduled",
      video_format: episode?.video_format ?? "video",
      video_link: episode?.video_link ?? "",
      audio_link: episode?.audio_link ?? "",
      pdf_link: episode?.pdf_link ?? "",
      is_archived: episode?.is_archived ?? slot?.add.archived ?? false,
    },
  });

  const categoryId = useWatch({ control, name: "category_id" });
  const competitionId = useWatch({ control, name: "competition_id" });
  const isPublished = useWatch({ control, name: "is_published" });
  const articleText = useWatch({ control, name: "article" });
  const articleLang = useWatch({ control, name: "article_lang" });
  const altLang: ArticleLang = articleLang === "hi" ? "en" : "hi";
  const langName = (l: ArticleLang) => (l === "hi" ? "Hindi" : "English");
  const altArticleText = useWatch({ control, name: "article_alt" });
  const altTitle = useWatch({ control, name: "title_alt" });
  const [showPreview, setShowPreview] = useState(false);
  const [showAltPreview, setShowAltPreview] = useState(false);
  const durationMinutes = useWatch({ control, name: "duration_minutes" });
  const durationSecs = useWatch({ control, name: "duration_secs" });
  const videoLink = useWatch({ control, name: "video_link" });
  const linkInfo = videoLink.trim() ? parseVideoLink(videoLink) : null;
  const audioLink = useWatch({ control, name: "audio_link" });
  const driveInfo = audioLink.trim() ? parseDriveLink(audioLink) : null;
  const pdfLink = useWatch({ control, name: "pdf_link" });
  const pdfDriveInfo = pdfLink.trim() ? parseDriveLink(pdfLink) : null;
  // Match readings need teams and a date; other categories (incl. the cricket guide) do not.
  const needsMatch = categories.find((c) => c.id === categoryId)?.requires_match ?? false;
  const competitionTeams = useMemo(() => teams.filter((t) => t.competition_id === competitionId), [teams, competitionId]);
  const titleField = register("title", {
    onChange: (e) => {
      if (!slugTouched) setValue("slug", slugify(e.target.value));
    },
  });

  const onSubmit = handleSubmit((v) => {
    setMessage(null);
    const payload: EpisodeInput = {
      id: episode?.id,
      title: v.title,
      slug: v.slug,
      excerpt: v.excerpt,
      description: v.description,
      article: v.article,
      article_lang: v.article_lang,
      title_alt: v.title_alt,
      excerpt_alt: v.excerpt_alt,
      description_alt: v.description_alt,
      article_alt: v.article_alt,
      category_id: v.category_id,
      audio_storage_path: audioPath,
      cover_image_path: coverPath,
      video_storage_path: videoPath,
      video_format: v.video_format,
      video_link: v.video_link.trim(),
      audio_link: v.audio_link.trim(),
      gallery_paths: galleryPaths,
      pdf_storage_path: pdfPath,
      pdf_link: v.pdf_link.trim(),
      is_archived: v.is_archived,
      duration_seconds: Math.max(0, Math.round(Number(v.duration_minutes) || 0) * 60 + Math.round(Number(v.duration_secs) || 0)),
      is_published: v.is_published,
      is_premium: v.is_premium,
      published_at: v.published_at_local ? fromZonedInputValue(v.published_at_local, timeZone) : "",
      match:
        needsMatch
          ? {
              competition_id: v.competition_id,
              team_a_id: v.team_a_id,
              team_b_id: v.team_b_id,
              match_date: v.match_date_local ? fromZonedInputValue(v.match_date_local, timeZone) : "",
              venue: v.venue,
              match_status: v.match_status,
            }
          : null,
    };
    const local = episodeInputSchema.safeParse(payload);
    if (!local.success) {
      setErrors(fieldErrors(local.error));
      setMessage({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }
    const hasSomething =
      !!payload.audio_storage_path ||
      !!v.audio_link.trim() ||
      !!(payload.article ?? "").trim() ||
      !!(payload.article_alt ?? "").trim() ||
      !!videoPath ||
      !!v.video_link.trim() ||
      galleryPaths.length > 0 ||
      !!pdfPath ||
      !!v.pdf_link.trim();
    if (payload.is_published && !hasSomething) {
      const msg = "Add audio, an article, a video, photos or a PDF to publish";
      setErrors({ audio_storage_path: msg, article: msg });
      setMessage({ kind: "error", text: `${msg}.` });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await saveEpisode(payload);
      if (!result.ok) {
        setErrors(result.fields ?? {});
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "success", text: "Post saved." });
      if (!episode) router.replace(`/admin/episodes/${result.data.id}?saved=1`);
      else router.refresh();
    });
  });

  const err = (key: string) => (errors[key] ? <p className="mt-1 text-sm text-red-300">{errors[key]}</p> : null);

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate data-testid="episode-form">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          }`}
          data-testid="form-message"
        >
          {message.text}
        </p>
      )}

      {slot && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm" data-testid="slot-banner">
          <span>This goes on the website under <strong className="text-gold-soft">{slot.section.title} › {slot.title}</strong></span>
          {!allFields && <button type="button" className="underline" onClick={() => setAllFields(true)}>Show all fields</button>}
        </div>
      )}

      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Details</h2>
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input id="title" className="input" {...titleField} />
          {err("title")}
        </div>
        <div>
          <label htmlFor="slug" className="label">URL slug</label>
          <input id="slug" className="input font-mono" {...register("slug", { onChange: () => setSlugTouched(true) })} />
          <p className="mt-1 text-xs text-muted">Leave empty to generate it from the title. Changing it changes the episode&apos;s web address.</p>
          {err("slug")}
        </div>
        <div>
          <label htmlFor="article_lang" className="label">Post language</label>
          <select id="article_lang" className="input sm:w-64" {...register("article_lang")}>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
          <p className="mt-1 text-xs text-muted">
            The language the title, description, notes and article below are written in. You can add a version in the other language
            further down; visitors see the version that matches the site language they chose.
          </p>
        </div>
        <div>
          <label htmlFor="category_id" className="label">Category</label>
          <select id="category_id" className="input" {...register("category_id")}>
            <option value="">Choose a category…</option>
            {categoriesByMenu(categories).map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          {err("category_id")}
        </div>
        <div>
          <label htmlFor="excerpt" className="label">Short description</label>
          <textarea id="excerpt" rows={2} maxLength={280} className="input" {...register("excerpt")} />
          <p className="mt-1 text-xs text-muted">Shown on cards and in search results. Up to 280 characters.</p>
          {err("excerpt")}
        </div>
        <div>
          <label htmlFor="description" className="label">Episode notes <span className="text-muted">(optional)</span></label>
          <textarea id="description" rows={6} className="input" {...register("description")} />
          <p className="mt-1 text-xs text-muted">Blank lines start new paragraphs.</p>
          {err("description")}
        </div>
      </section>

      {needsMatch && (
        <section className="card space-y-5 p-6" data-testid="match-fields">
          <h2 className="text-2xl font-semibold">Match information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="competition_id" className="label">Competition</label>
              <select
                id="competition_id"
                className="input"
                {...register("competition_id", { onChange: () => { setValue("team_a_id", ""); setValue("team_b_id", ""); } })}
              >
                {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {err("match.competition_id")}
            </div>
            <div>
              <label htmlFor="match_status" className="label">Match status</label>
              <select id="match_status" className="input" {...register("match_status")}>
                {MATCH_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="team_a_id" className="label">Team A</label>
              <select id="team_a_id" className="input" {...register("team_a_id")}>
                <option value="">Choose…</option>
                {competitionTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {err("match.team_a_id")}
            </div>
            <div>
              <label htmlFor="team_b_id" className="label">Team B</label>
              <select id="team_b_id" className="input" {...register("team_b_id")}>
                <option value="">Choose…</option>
                {competitionTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {err("match.team_b_id")}
            </div>
            <div>
              <label htmlFor="match_date_local" className="label">Match start ({timeZone})</label>
              <input id="match_date_local" type="datetime-local" className="input" {...register("match_date_local")} />
              {err("match.match_date")}
            </div>
            <div>
              <label htmlFor="venue" className="label">Venue <span className="text-muted">(optional)</span></label>
              <input id="venue" className="input" {...register("venue")} />
            </div>
          </div>
          <p className="text-xs text-muted">
            Missing a team or league? Add it under <Link href="/admin/leagues" className="underline">Leagues &amp; teams</Link>.
          </p>
        </section>
      )}

      {show("article") && (<>
      <section className="card space-y-5 p-6" data-testid="article-fields">
        <h2 className="text-2xl font-semibold">
          Article <span className="text-base font-normal text-muted">(optional, in {langName(articleLang)})</span>
        </h2>
        <div>
          <label htmlFor="article" className="label">Article text</label>
          <textarea
            id="article"
            rows={14}
            lang={articleLang}
            className="input leading-relaxed"
            placeholder={"Paste the article here, e.g. a Hindi piece on Shani or Shukra.\n\nBlank line = new paragraph · ## Heading · - Bullet point · **bold**"}
            {...register("article")}
          />
          <p className="mt-1 text-xs text-muted">
            A post can have any mix of audio, an article, a video or reel, and photos. Blank line = new paragraph · <code>## </code>heading · <code>- </code>bullet ·{" "}
            <code>**bold**</code>. Premium articles are shown only to the astrologer until the premium package is arranged.
          </p>
          {err("article")}
        </div>
        {articleText.trim() && (
          <div>
            <button type="button" className="btn-ghost px-4 py-2 text-xs" onClick={() => setShowPreview((v) => !v)} data-testid="article-preview-toggle">
              {showPreview ? "Hide preview" : "Preview article"}
            </button>
            {showPreview && (
              <div className="mt-4 rounded-2xl border border-line bg-night/50 p-5" data-testid="article-preview">
                <ArticleBody source={articleText} lang={articleLang} />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card space-y-5 p-6" data-testid="translation-fields">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">
            {langName(altLang)} version <span className="text-base font-normal text-muted">(optional)</span>
          </h2>
          <p className="text-sm text-muted">
            Visitors who choose {langName(altLang)} on the site see this version. Leave it empty and they see the {langName(articleLang)}{" "}
            text with a small “In {langName(articleLang)}” label. The audio, cover and category are shared.
          </p>
        </div>
        <div>
          <label htmlFor="title_alt" className="label">{langName(altLang)} heading</label>
          <input id="title_alt" lang={altLang} className="input" {...register("title_alt")} />
          {err("title_alt")}
        </div>
        <div>
          <label htmlFor="excerpt_alt" className="label">{langName(altLang)} short summary</label>
          <textarea id="excerpt_alt" lang={altLang} rows={2} maxLength={280} className="input" {...register("excerpt_alt")} />
          {err("excerpt_alt")}
        </div>
        <div>
          <label htmlFor="description_alt" className="label">{langName(altLang)} notes</label>
          <textarea id="description_alt" lang={altLang} rows={4} className="input" {...register("description_alt")} />
          {err("description_alt")}
        </div>
        <div>
          <label htmlFor="article_alt" className="label">{langName(altLang)} article</label>
          <textarea id="article_alt" lang={altLang} rows={10} className="input leading-relaxed" {...register("article_alt")} />
          <p className="mt-1 text-xs text-muted">Same formatting as the main article.</p>
          {err("article_alt")}
        </div>
        {altArticleText.trim() && (
          <div>
            <button type="button" className="btn-ghost px-4 py-2 text-xs" onClick={() => setShowAltPreview((v) => !v)}>
              {showAltPreview ? "Hide preview" : `Preview ${langName(altLang)} article`}
            </button>
            {showAltPreview && (
              <div className="mt-4 rounded-2xl border border-line bg-night/50 p-5">
                <ArticleBody source={altArticleText} lang={altLang} />
              </div>
            )}
          </div>
        )}
        {!altTitle.trim() && altArticleText.trim() && (
          <p className="text-xs text-gold-soft">Tip: add a {langName(altLang)} heading too, so cards show the {langName(altLang)} title.</p>
        )}
      </section>
      </>)}

      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">{show("audio") ? "Media" : "Cover image"}</h2>
        {show("audio") && (<>
        <FileField
          id="audio"
          kind="audio"
          label="Audio file (optional)"
          hint="MP3, M4A, AAC, OGG or WAV. The duration is read from the file automatically."
          value={audioPath}
          previewUrl={episode?.audio_storage_path ? audioUrl(episode.id) : null}
          onChange={setAudioPath}
          onDuration={(s) => {
            setValue("duration_minutes", Math.floor(s / 60));
            setValue("duration_secs", s % 60);
          }}
          error={errors.audio_storage_path}
        />
        <div>
          <label htmlFor="audio_link" className="label">…or Google Drive link (for long audio such as an audiobook)</label>
          <input
            id="audio_link"
            className="input"
            inputMode="url"
            placeholder="https://drive.google.com/file/d/…/view"
            {...register("audio_link")}
          />
          {audioLink.trim() && !driveInfo && <p className="mt-1 text-sm text-red-300">This doesn&apos;t look like a Google Drive file link.</p>}
          {driveInfo && <p className="mt-1 text-xs text-emerald-300" data-testid="drive-link-ok">Google Drive file recognised.</p>}
          <p className="mt-1 text-xs text-muted">
            In Google Drive: right-click the file → Share → General access: <b>Anyone with the link</b> → Copy link, and paste it here. No size limit.
            Anyone with the link can listen and download, so don&apos;t use it for premium audio. Type the duration below if you want it shown.
          </p>
          {err("audio_link")}
        </div>
        <div>
          <span className="label">Duration</span>
          <div className="flex items-center gap-2">
            <input aria-label="Minutes" type="number" min={0} className="input w-24" {...register("duration_minutes", { valueAsNumber: true })} />
            <span className="text-sm text-muted">min</span>
            <input aria-label="Seconds" type="number" min={0} max={59} className="input w-24" {...register("duration_secs", { valueAsNumber: true })} />
            <span className="text-sm text-muted">sec</span>
            <span className="text-xs text-muted">
              ({formatDuration((Number(durationMinutes) || 0) * 60 + (Number(durationSecs) || 0))})
            </span>
          </div>
          {err("duration_seconds")}
        </div>
        </>)}
        <FileField
          id="cover"
          kind="cover"
          label="Cover image"
          hint="Square images work best (at least 600 × 600). JPG, PNG, WebP or AVIF, up to 5 MB."
          value={coverPath}
          previewUrl={imageUrl(coverPath)}
          onChange={(p) => {
            setCoverPath(p);
            setThumbNote(null);
          }}
          error={errors.cover_image_path}
        />
        {thumbNote && (
          <p className="-mt-3 text-xs text-gold-soft" data-testid="thumb-note">
            {thumbNote}
          </p>
        )}
      </section>

      {(show("video") || show("photos")) && (
      <section className="card space-y-5 p-6" data-testid="video-fields">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Video, reel &amp; photos <span className="text-base font-normal text-muted">(optional)</span></h2>
          <p className="text-sm text-muted">Upload a short clip, or paste a YouTube / Instagram link. Long or popular videos are best as links: they cost nothing to stream.</p>
        </div>
        {show("video") && (<>
        <fieldset>
          <legend className="label">Video shape</legend>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" value="video" className="accent-[#d4af37]" {...register("video_format")} /> Video (wide, 16:9)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="reel" className="accent-[#d4af37]" {...register("video_format")} data-testid="format-reel" /> Reel / Short (tall, 9:16)
            </label>
          </div>
        </fieldset>
        <FileField
          id="video"
          kind="video"
          label="Video file"
          hint="MP4 (best), WebM or MOV, up to 50 MB: about 2–3 minutes of phone video at 1080p. Premium videos are locked for visitors, like premium audio."
          value={videoPath}
          previewUrl={episode?.video_storage_path ? videoUrl(episode.id) : null}
          onChange={setVideoPath}
          onUploaded={(file) => void coverFromVideo(file)}
          error={errors.video_storage_path}
        />
        <div>
          <label htmlFor="video_link" className="label">…or YouTube / Instagram link</label>
          <input
            id="video_link"
            className="input"
            inputMode="url"
            placeholder="https://www.youtube.com/shorts/…  or  https://www.instagram.com/reel/…"
            {...register("video_link")}
          />
          {videoLink.trim() && !linkInfo && <p className="mt-1 text-sm text-red-300">This doesn&apos;t look like a YouTube or Instagram video link.</p>}
          {linkInfo && (
            <p className="mt-1 text-xs text-emerald-300" data-testid="video-link-ok">
              {linkInfo.provider === "youtube" ? "YouTube" : "Instagram"} {linkInfo.vertical ? "short/reel" : "video"} recognised.
              {linkInfo.vertical ? " Tip: choose “Reel / Short” above." : ""}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">Links are public on YouTube/Instagram anyway, so don&apos;t use a link for premium content.</p>
          {err("video_link")}
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#d4af37]" {...register("is_archived")} data-testid="archived-checkbox" />
          <span>
            <span className="font-medium">Old video</span>
            <span className="block text-sm text-muted">Listed under Astro Cricket › Old Videos instead of the current videos.</span>
          </span>
        </label>
        </>)}
        {show("photos") && <GalleryField value={galleryPaths} onChange={setGalleryPaths} error={errors.gallery_paths} />}
      </section>
      )}

      {show("pdf") && (
      <section className="card space-y-5 p-6" data-testid="pdf-fields">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">PDF <span className="text-base font-normal text-muted">(optional)</span></h2>
          <p className="text-sm text-muted">For the book or any document. Visitors can read it on the page and download it free.</p>
        </div>
        <FileField
          id="pdf"
          kind="pdf"
          label="PDF file"
          hint="Up to 50 MB. For a larger file, use a Google Drive link below."
          value={pdfPath}
          previewUrl={documentUrl(episode?.pdf_storage_path)}
          onChange={setPdfPath}
          error={errors.pdf_storage_path}
        />
        <div>
          <label htmlFor="pdf_link" className="label">…or Google Drive link to the PDF</label>
          <input id="pdf_link" className="input" inputMode="url" placeholder="https://drive.google.com/file/d/…/view" {...register("pdf_link")} />
          {pdfLink.trim() && !pdfDriveInfo && <p className="mt-1 text-sm text-red-300">This doesn&apos;t look like a Google Drive file link.</p>}
          {pdfDriveInfo && <p className="mt-1 text-xs text-emerald-300" data-testid="pdf-link-ok">Google Drive file recognised. Share it as “Anyone with the link”.</p>}
          {err("pdf_link")}
        </div>
      </section>
      )}

      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Publishing</h2>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#d4af37]" {...register("is_premium")} />
          <span>
            <span className="font-medium">Premium episode</span>
            <span className="block text-sm text-muted">
              Premium audio is locked for visitors. They see a “Contact for full package” button that opens the contact form with this episode named in the subject.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#d4af37]" {...register("is_published")} data-testid="publish-checkbox" />
          <span>
            <span className="font-medium">Published</span>
            <span className="block text-sm text-muted">Unpublished episodes are drafts that only administrators can see.</span>
          </span>
        </label>
        <div className="max-w-xs">
          <label htmlFor="published_at_local" className="label">Publication date ({timeZone})</label>
          <input id="published_at_local" type="datetime-local" className="input" {...register("published_at_local")} />
          <p className="mt-1 text-xs text-muted">
            {isPublished ? "Leave empty to publish now. A future date schedules the episode." : "Used when the episode is published."}
          </p>
          {err("published_at")}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-gold px-6" disabled={pending} data-testid="save-episode">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {pending ? "Saving…" : "Save post"}
        </button>
        <Link href={slot ? `/admin/site/${slot.section.key}` : "/admin/episodes"} className="btn-ghost">Back</Link>
      </div>
    </form>
  );
}
