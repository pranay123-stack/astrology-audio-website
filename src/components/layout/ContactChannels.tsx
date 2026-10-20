import { Link2, Mail, MapPin, Phone, Send, ShoppingBag } from "lucide-react";
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/BrandIcons";
import { getDict } from "@/lib/i18n";
import type { Locale, Profile } from "@/lib/types";

/** "@handle" from a profile URL such as https://www.instagram.com/amitastrocr/ or https://www.youtube.com/@ASTROCRICKET. */
export function handleFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    return seg ? (seg.startsWith("@") ? seg : `@${seg}`) : url;
  } catch {
    return url;
  }
}

/** "+91 89813 45111" from a wa.me link such as https://wa.me/918981345111; null when the link has no number. */
export function whatsappNumber(url: string): string | null {
  try {
    const u = new URL(url);
    const digits = (u.hostname.endsWith("wa.me") ? u.pathname : (u.searchParams.get("phone") ?? "")).replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    return digits.length >= 8 ? `+${digits}` : null;
  } catch {
    return null;
  }
}

/** The astrologer's direct contact channels: WhatsApp first, then social links, email, phone and location. */
export function ContactChannels({ profile, lang }: { profile: Profile; lang: Locale }) {
  const t = getDict(lang).contact;
  const { whatsapp, instagram, youtube, telegram, amazon, linktree } = profile.social_links ?? {};
  const waNumber = whatsapp ? whatsappNumber(whatsapp) : null;
  const hasAny =
    whatsapp || instagram || youtube || telegram || amazon || linktree || profile.contact_email || profile.contact_phone || profile.location;
  if (!hasAny) return null;
  return (
    <div className="card space-y-4 p-6" data-testid="contact-channels">
      <h2 className="text-2xl font-semibold">{t.reach}</h2>
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
            {t.whatsapp}
            {waNumber && <span className="text-xs font-medium opacity-80">{waNumber}</span>}
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
                <span className="block font-medium">{t.instagram}</span>
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
                <span className="block font-medium">{t.youtube}</span>
                <span className="text-muted">{handleFromUrl(youtube)}</span>
              </span>
            </a>
          </li>
        )}
        {telegram && (
          <li>
            <a href={telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-soft" data-testid="telegram-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9] text-white">
                <Send className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{t.telegram}</span>
                <span className="text-muted">{handleFromUrl(telegram)}</span>
              </span>
            </a>
          </li>
        )}
        {amazon && (
          <li>
            <a href={amazon} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-soft" data-testid="amazon-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff9900] text-[#131921]">
                <ShoppingBag className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{t.amazon}</span>
                <span className="text-muted">{t.amazonSub}</span>
              </span>
            </a>
          </li>
        )}
        {linktree && (
          <li>
            <a href={linktree} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-soft" data-testid="linktree-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#43e660] text-[#0b1f10]">
                <Link2 className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{t.allLinks}</span>
                <span className="text-muted">linktr.ee/{handleFromUrl(linktree).replace(/^@/, "")}</span>
              </span>
            </a>
          </li>
        )}
        {profile.contact_phone && (
          <li>
            <a href={`tel:${profile.contact_phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 hover:text-gold-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-gold-soft"><Phone className="h-4 w-4" aria-hidden /></span>
              <span><span className="block font-medium">{t.call}</span><span className="text-muted">{profile.contact_phone}</span></span>
            </a>
          </li>
        )}
        {profile.contact_email && (
          <li>
            <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-3 hover:text-gold-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-gold-soft"><Mail className="h-4 w-4" aria-hidden /></span>
              <span><span className="block font-medium">{t.email}</span><span className="text-muted">{profile.contact_email}</span></span>
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
