import { siteConfig } from "./config";
import type { DashboardStats } from "./data/repository";
import type { Profile } from "./types";

/** Storage path of the abstract placeholder portrait created by the seed script (stableUuid("placeholder-profile")). */
export const PLACEHOLDER_PROFILE_IMAGE = "profile/7f4e22d9-e5e6-4e04-a823-6d9b7d4c0858.webp";
export const DEFAULT_SITE_NAME = "Celestial Voice Astrology";

export interface LaunchCheck {
  id: string;
  label: string;
  done: boolean;
  /** Where the admin fixes it, or null when it is a hosting setting. */
  href: string | null;
  hint: string;
}

const looksLikePlaceholder = (text: string) => !text.trim() || /^placeholder|this is placeholder text/i.test(text.trim());

/** Content and configuration that must be real before the site is launched publicly. */
export function launchChecks(profile: Profile, stats: DashboardStats): LaunchCheck[] {
  return [
    { id: "name", label: "Astrologer name", done: profile.display_name !== "Your Astrologer Name", href: "/admin/profile", hint: "Replace “Your Astrologer Name”." },
    { id: "photo", label: "Profile photograph", done: !!profile.profile_image_path && profile.profile_image_path !== PLACEHOLDER_PROFILE_IMAGE, href: "/admin/profile", hint: "Upload a real photo." },
    { id: "bio", label: "Biography and experience", done: !looksLikePlaceholder(profile.biography) && !looksLikePlaceholder(profile.experience), href: "/admin/profile", hint: "Replace the placeholder text. Only include verifiable credentials." },
    { id: "consult", label: "Consultation details", done: !looksLikePlaceholder(profile.consultation_info), href: "/admin/profile", hint: "Explain how consultations and the premium package work." },
    { id: "contact", label: "Public contact email", done: !!profile.contact_email, href: "/admin/profile", hint: "Shown in the footer and the privacy policy." },
    { id: "legal", label: "Legal business name and jurisdiction", done: !!profile.legal_business_name && !!profile.legal_jurisdiction, href: "/admin/profile", hint: "Fills the Privacy, Terms and Disclaimer pages." },
    { id: "demo", label: "Sample content removed", done: stats.demo === 0, href: "/admin", hint: "Use “Remove sample content” once real episodes exist." },
    { id: "episodes", label: "At least one real episode published", done: stats.published - stats.demo > 0, href: "/admin/episodes/new", hint: "Upload the first real reading." },
    { id: "brand", label: "Site name confirmed", done: siteConfig.name !== DEFAULT_SITE_NAME, href: null, hint: "Set NEXT_PUBLIC_SITE_NAME in the hosting settings and redeploy (the current name is a placeholder)." },
    { id: "url", label: "Live domain configured", done: !/localhost|127\.0\.0\.1/.test(siteConfig.url) && siteConfig.url.startsWith("https://"), href: null, hint: "Set NEXT_PUBLIC_SITE_URL=https://your-domain and redeploy." },
  ];
}
