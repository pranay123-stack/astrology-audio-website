import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { getDict, localePath, localizeProfile } from "@/lib/i18n";
import { getProfile } from "@/lib/queries";
import type { Locale, SocialLinks } from "@/lib/types";
import { LogoMark } from "./Logo";
import { NAV_LINKS } from "./nav";

export async function SiteFooter({ lang }: { lang: Locale }) {
  const t = getDict(lang);
  const href = (path: string) => localePath(lang, path);
  const profile = localizeProfile(await getProfile(), lang);
  const socials = (Object.keys(t.footer.social) as (keyof SocialLinks)[]).filter((k) => profile.social_links?.[k]);

  return (
    <footer className="relative mt-24 border-t border-line bg-gradient-to-b from-night to-navy">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-2xl font-semibold">{siteConfig.name}</span>
          </div>
          <p className="max-w-sm text-sm text-muted">{profile.tagline}</p>
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={t.contact.social}>
              {socials.map((k) => (
                <li key={k}>
                  <a
                    href={profile.social_links[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip border border-line bg-white/5 py-1 text-ink/80 normal-case hover:border-gold/50 hover:text-gold-soft"
                  >
                    {t.footer.social[k]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label={t.footer.explore}>
          <h2 className="eyebrow mb-4 font-sans">{t.footer.explore}</h2>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={href(l.href)} className="text-ink/80 hover:text-gold-soft">
                  {t.nav[l.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow mb-4 font-sans">{t.footer.contact}</h2>
          <ul className="space-y-2 text-sm text-ink/80">
            {profile.contact_email && (
              <li>
                <a href={`mailto:${profile.contact_email}`} className="inline-flex items-center gap-2 hover:text-gold-soft">
                  <Mail className="h-4 w-4" aria-hidden /> {profile.contact_email}
                </a>
              </li>
            )}
            {profile.contact_phone && (
              <li>
                <a href={`tel:${profile.contact_phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 hover:text-gold-soft">
                  <Phone className="h-4 w-4" aria-hidden /> {profile.contact_phone}
                </a>
              </li>
            )}
            <li>
              <Link href={href("/contact")} className="hover:text-gold-soft">
                {t.footer.sendMessage}
              </Link>
            </li>
          </ul>
          <h2 className="eyebrow mt-8 mb-4 font-sans">{t.footer.legal}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href={href("/privacy")} className="text-ink/80 hover:text-gold-soft">{t.footer.privacy}</Link></li>
            <li><Link href={href("/terms")} className="text-ink/80 hover:text-gold-soft">{t.footer.terms}</Link></li>
            <li><Link href={href("/disclaimer")} className="text-ink/80 hover:text-gold-soft">{t.footer.disclaimer}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            {t.footer.note}{" "}
            <Link href={href("/disclaimer")} className="underline underline-offset-2 hover:text-gold-soft">{t.footer.readDisclaimer}</Link>.
          </p>
          <p className="shrink-0">
            © {profile.legal_business_name || profile.display_name}
          </p>
        </div>
      </div>
    </footer>
  );
}
