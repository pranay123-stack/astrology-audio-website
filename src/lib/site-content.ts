import { z } from "zod";
import { KRISHNA, type KrishnaContent } from "@/content/krishna";
import { CRICKET_RULES, SHANI_RULES, SPIRITUAL_RULES, type Rule } from "@/content/rules";
import { QUOTE, type QuoteContent } from "@/content/quote";

/** Page text edited in Admin (not posts). A key with nothing saved shows the bundled text. */
export interface SiteContent {
  rules: { spiritual: Rule[]; cricket: Rule[]; shani: Rule[] };
  krishna: KrishnaContent;
  quotes: QuoteContent;
}

export type SiteContentKey = keyof SiteContent;

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  rules: { spiritual: SPIRITUAL_RULES, cricket: CRICKET_RULES, shani: SHANI_RULES },
  krishna: KRISHNA,
  quotes: QUOTE,
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
} satisfies { [K in SiteContentKey]: z.ZodType<SiteContent[K]> };
