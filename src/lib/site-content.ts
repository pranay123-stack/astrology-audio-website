import { z } from "zod";
import { KRISHNA, type KrishnaContent } from "@/content/krishna";
import { CRICKET_RULES, SHANI_RULES, SPIRITUAL_RULES, type Rule } from "@/content/rules";
import { POPUP, type PopupContent } from "@/content/popup";
import { QUOTE, type QuoteContent } from "@/content/quote";

/** Page text edited in Admin (not posts). A key with nothing saved shows the bundled text. */
export interface SiteContent {
  rules: { spiritual: Rule[]; cricket: Rule[]; shani: Rule[] };
  krishna: KrishnaContent;
  quotes: QuoteContent;
  popup: PopupContent;
}

export type SiteContentKey = keyof SiteContent;

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  rules: { spiritual: SPIRITUAL_RULES, cricket: CRICKET_RULES, shani: SHANI_RULES },
  krishna: KRISHNA,
  quotes: QUOTE,
  popup: POPUP,
};

const line = (max = 300) => z.string().trim().min(1, "Required").max(max);
const paragraph = z.string().trim().min(1, "Required").max(3000);

const ruleSchema = z.object({
  title: line(),
  body: z.array(paragraph).max(30).optional(),
  planet: z.string().trim().max(80).optional(),
  chakra: z.string().trim().max(80).optional(),
  list: z.array(z.object({ label: line(80), text: line(600) })).max(30).optional(),
  note: z.string().trim().max(1000).optional(),
});
const rulesList = z.array(ruleSchema).max(100);

const share = z.object({ share: line(10), label: line(80), text: paragraph });

export const siteContentSchemas = {
  rules: z.object({ spiritual: rulesList, cricket: rulesList, shani: rulesList }),
  krishna: z.object({
    questions: z.array(z.object({ thought: paragraph, answer: paragraph })).max(12),
    middle: z.array(paragraph).max(20),
    story: z.array(paragraph).max(20),
    luck: share,
    karma: share,
    how: z.object({ question: line(), answer: z.array(paragraph).max(20) }),
    closing: line(),
  }),
  quotes: z.object({ text: line(400), author: line(120), role_en: z.string().trim().max(400), role_hi: z.string().trim().max(400) }),
  popup: z
    .object({
      enabled: z.boolean(),
      title_en: z.string().trim().max(120),
      title_hi: z.string().trim().max(120),
      text_en: z.string().trim().max(1000),
      text_hi: z.string().trim().max(1000),
      image_path: z.string().regex(/^covers\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/, "Upload the picture again").nullable(),
      button_en: z.string().trim().max(40),
      button_hi: z.string().trim().max(40),
      link: z
        .string()
        .trim()
        .max(500)
        .refine((v) => v === "" || /^\/(?!\/)/.test(v) || /^https?:\/\/[^\s]+$/.test(v), "Use a page of this site (/contact) or a full link (https://…)"),
      starts_at: z.string().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Invalid start date"),
      ends_at: z.string().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Invalid end date"),
      delay_seconds: z.number().int().min(0).max(600),
      repeat_hours: z.number().int().min(0).max(24 * 30),
      version: z.string().max(40),
    })
    .refine((p) => !p.enabled || p.title_en.length > 0, { message: "Add a title to switch the popup on", path: ["title_en"] })
    .refine((p) => !p.starts_at || !p.ends_at || Date.parse(p.starts_at) < Date.parse(p.ends_at), { message: "The end must be after the start", path: ["ends_at"] })
    .refine((p) => !p.button_en || !!p.link, { message: "Add where the button goes", path: ["link"] }),
} satisfies { [K in SiteContentKey]: z.ZodType<SiteContent[K]> };
