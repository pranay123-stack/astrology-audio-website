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
];

type Values = Omit<ProfileInput, "specializations" | "profile_image_path"> & { specializations_text: string };

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
      social_links: { youtube: "", instagram: "", facebook: "", x: "", whatsapp: "", spotify: "", ...profile.social_links },
      legal_business_name: profile.legal_business_name,
      legal_jurisdiction: profile.legal_jurisdiction,
    },
  });

  const onSubmit = handleSubmit(({ specializations_text, ...v }) => {
    const payload: ProfileInput = {
      ...v,
      profile_image_path: photo,
      specializations: specializations_text.split("\n").map((s) => s.trim()).filter(Boolean),
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
      <section className="card space-y-5 p-6">
        <h2 className="text-2xl font-semibold">Contact details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("contact_email", "Public email", { type: "email" })}
          {field("contact_phone", "Phone")}
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
                <p className="mt-1 text-xs text-muted">Use https://wa.me/ followed by the country code and number, without + or spaces.</p>
              )}
              {err(`social_links.${s.key}`)}
            </div>
          ))}
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
