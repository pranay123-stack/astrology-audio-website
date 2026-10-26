"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { saveProfile } from "@/app/admin/actions";
import { imageUrl } from "@/lib/media/urls";
import type { Profile, SocialLinks } from "@/lib/types";
import { fieldErrors, profileInputSchema, type ProfileInput } from "@/lib/validation";
import { FileField } from "./FileField";

const SOCIALS: { key: keyof SocialLinks; label: string }[] = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "whatsapp", label: "WhatsApp link" },
  { key: "spotify", label: "Spotify" },
  { key: "telegram", label: "Telegram" },
  { key: "amazon", label: "Amazon" },
  { key: "linktree", label: "Linktree (all links)" },
];

type HindiValues = { display_name: string; tagline: string; biography: string; experience: string; location: string; consultation_info: string };
type Values = Omit<ProfileInput, "specializations" | "profile_image_path" | "hi"> & {
  specializations_text: string;
  hi: HindiValues;
  hi_specializations_text: string;
};

/** Hindi fields of the profile; each falls back to the English text on the site while empty. */
const HINDI_FIELDS: { key: keyof HindiValues; label: string; rows?: number }[] = [
  { key: "display_name", label: "नाम" },
  { key: "tagline", label: "टैगलाइन" },
  { key: "biography", label: "परिचय", rows: 6 },
  { key: "experience", label: "अनुभव और पृष्ठभूमि", rows: 4 },
  { key: "location", label: "स्थान" },
  { key: "consultation_info", label: "परामर्श कैसे होता है", rows: 4 },
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [photo, setPhoto] = useState<string | null>(profile.profile_image_path);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      display_name: profile.display_name,
      tagline: profile.tagline,
      biography: profile.biography,
      experience: profile.experience,
      specializations_text: profile.specializations.join("\n"),
      contact_email: profile.contact_email,
      contact_phone: profile.contact_phone,
      location: profile.location,
      consultation_info: profile.consultation_info,
      social_links: { youtube: "", instagram: "", facebook: "", x: "", whatsapp: "", spotify: "", telegram: "", amazon: "", linktree: "", google_form: "", ...profile.social_links },
      legal_business_name: profile.legal_business_name,
      legal_jurisdiction: profile.legal_jurisdiction,
      hi: {
        display_name: profile.hi?.display_name ?? "",
        tagline: profile.hi?.tagline ?? "",
        biography: profile.hi?.biography ?? "",
        experience: profile.hi?.experience ?? "",
        location: profile.hi?.location ?? "",
        consultation_info: profile.hi?.consultation_info ?? "",
      },
      hi_specializations_text: (profile.hi?.specializations ?? []).join("\n"),
    },
  });

  const lines = (text: string) => text.split("\n").map((s) => s.trim()).filter(Boolean);
  const onSubmit = handleSubmit(({ specializations_text, hi_specializations_text, hi, ...v }) => {
    const payload: ProfileInput = {
      ...v,
      profile_image_path: photo,
      specializations: lines(specializations_text),
      hi: { ...hi, specializations: lines(hi_specializations_text) },
    };
    const local = profileInputSchema.safeParse(payload);
    if (!local.success) {
      setErrors(fieldErrors(local.error));
      setMessage({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }
    startTransition(async () => {
      const result = await saveProfile(payload);
      if (!result.ok) {
        setErrors(result.fields ?? {});
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setErrors({});
      setMessage({ kind: "success", text: "Profile saved. The public pages now show the new details." });
      router.refresh();
    });
  });

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm text-red-300">{errors[k]}</p> : null);
  const field = (name: keyof Values & string, label: string, opts: { textarea?: number; hint?: string; type?: string } = {}) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {opts.textarea ? (
        <textarea id={name} rows={opts.textarea} className="input" {...register(name)} />
      ) : (
        <input id={name} type={opts.type ?? "text"} className="input" {...register(name)} />
      )}
      {opts.hint && <p className="mt-1 text-xs text-muted">{opts.hint}</p>}
      {err(name)}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate data-testid="profile-form">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}
        >
          {message.text}
        </p>
      )}
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Public profile</h2>
        {field("display_name", "Display name")}
        {field("tagline", "Tagline", { hint: "One line shown in the footer and on the About page." })}
        <FileField id="photo" kind="profile" label="Photograph" value={photo} previewUrl={imageUrl(profile.profile_image_path)} onChange={setPhoto} error={errors.profile_image_path} />
        {field("biography", "Introduction", { textarea: 6 })}
        {field("experience", "Experience and background", { textarea: 4, hint: "Only include credentials and experience that can be verified." })}
        {field("specializations_text", "Specialisations", { textarea: 4, hint: "One per line." })}
        {field("consultation_info", "Consultations", { textarea: 4, hint: "How personal consultations work. Shown on the About and Contact pages." })}
      </section>
      <section className="card space-y-5 p-6" lang="hi" data-testid="profile-hindi">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Hindi version · हिंदी संस्करण</h2>
          <p className="text-sm text-muted" lang="en">
            Shown to visitors who choose Hindi. Any field left empty shows the English text instead.
          </p>
        </div>
        {HINDI_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`hi-${f.key}`} className="label">{f.label}</label>
            {f.rows ? (
              <textarea id={`hi-${f.key}`} rows={f.rows} className="input" {...register(`hi.${f.key}` as const)} />
            ) : (
              <input id={`hi-${f.key}`} className="input" {...register(`hi.${f.key}` as const)} />
            )}
            {err(`hi.${f.key}`)}
          </div>
        ))}
        <div>
          <label htmlFor="hi-specializations" className="label">विशेषज्ञता</label>
          <textarea id="hi-specializations" rows={4} className="input" {...register("hi_specializations_text")} />
          <p className="mt-1 text-xs text-muted" lang="en">One per line.</p>
          {err("hi.specializations")}
        </div>
      </section>
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Contact details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("contact_email", "Public email", { type: "email" })}
          {field("contact_phone", "Phone for calls (leave empty for WhatsApp only)")}
          {field("location", "Location")}
        </div>
      </section>
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Social media</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIALS.map((s) => (
            <div key={s.key}>
              <label htmlFor={`social-${s.key}`} className="label">{s.label}</label>
              <input
                id={`social-${s.key}`}
                placeholder={s.key === "whatsapp" ? "https://wa.me/919876543210" : "https://"}
                className="input"
                {...register(`social_links.${s.key}` as const)}
              />
              {s.key === "whatsapp" && (
                <p className="mt-1 text-xs text-muted">Use https://wa.me/ followed by the country code and number, without + or spaces. The number is shown on the WhatsApp button.</p>
              )}
              {err(`social_links.${s.key}`)}
            </div>
          ))}
        </div>
      </section>
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Questionnaire (Google Form)</h2>
        <p className="text-sm text-muted">
          Shown on the Contact page for visitors who want to learn cricket astrology. In Google Forms click <b>Send</b> → the link tab
          (🔗) → <b>Copy</b>, and paste it here. Answers arrive in Google Forms / Google Sheets, not here.
        </p>
        <div>
          <label htmlFor="social-google_form" className="label">Google Form link</label>
          <input
            id="social-google_form"
            placeholder="https://docs.google.com/forms/d/e/…/viewform"
            className="input"
            {...register("social_links.google_form")}
          />
          <p className="mt-1 text-xs text-muted">The full docs.google.com link is shown inside the page. A short forms.gle link is shown as a button that opens the form.</p>
          {err("social_links.google_form")}
        </div>
      </section>
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Legal details</h2>
        <p className="text-sm text-muted">Used on the Privacy, Terms and Disclaimer pages. Until filled in, those pages show highlighted placeholders.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("legal_business_name", "Business or trading name")}
          {field("legal_jurisdiction", "Governing jurisdiction", { hint: "e.g. New South Wales, Australia" })}
        </div>
      </section>
      <button type="submit" className="btn-gold px-6" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} Save profile
      </button>
    </form>
  );
}
