import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/BrandIcons";
import type { Profile } from "@/lib/types";

/** "@handle" from a profile URL such as https://www.instagram.com/amitastrocr/ or https://www.youtube.com/@ASTROCRICKET. */
export function handleFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    return seg ? (seg.startsWith("@") ? seg : `@${seg}`) : url;
  } catch {
    return url;
  }
}

/** The astrologer's direct contact channels: WhatsApp first, then Instagram, YouTube, email, phone and location. */
export function ContactChannels({ profile }: { profile: Profile }) {
  const { whatsapp, instagram, youtube } = profile.social_links ?? {};
  const hasAny = whatsapp || instagram || youtube || profile.contact_email || profile.contact_phone || profile.location;
  if (!hasAny) return null;
  return (
    <div className="card space-y-4 p-6" data-testid="contact-channels">
      <h2 className="text-2xl font-semibold">Reach the astrologer</h2>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3 font-semibold text-[#06281a] transition hover:brightness-110"
          data-testid="whatsapp-link"
        >
          <WhatsAppIcon className="h-6 w-6" />
          <span className="flex flex-col leading-tight">
            Chat on WhatsApp
            {profile.contact_phone && <span className="text-xs font-medium opacity-80">{profile.contact_phone}</span>}
          </span>
        </a>
      )}
      <ul className="space-y-3 text-sm">
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-soft" data-testid="instagram-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white">
                <InstagramIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-medium">Instagram</span>
                <span className="text-muted">{handleFromUrl(instagram)}</span>
              </span>
            </a>
          </li>
        )}
        {youtube && (
          <li>
            <a href={youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-soft" data-testid="youtube-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff0000] text-white">
                <YouTubeIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-medium">YouTube</span>
                <span className="text-muted">{handleFromUrl(youtube)}</span>
              </span>
            </a>
          </li>
        )}
        {profile.contact_phone && (
          <li>
            <a href={`tel:${profile.contact_phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 hover:text-gold-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-gold-soft"><Phone className="h-4 w-4" aria-hidden /></span>
              <span><span className="block font-medium">Call</span><span className="text-muted">{profile.contact_phone}</span></span>
            </a>
          </li>
        )}
        {profile.contact_email && (
          <li>
            <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-3 hover:text-gold-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-gold-soft"><Mail className="h-4 w-4" aria-hidden /></span>
              <span><span className="block font-medium">Email</span><span className="text-muted">{profile.contact_email}</span></span>
            </a>
          </li>
        )}
        {profile.location && (
          <li className="flex items-center gap-3 text-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-gold-soft"><MapPin className="h-4 w-4" aria-hidden /></span>
            {profile.location}
          </li>
        )}
      </ul>
    </div>
  );
}
