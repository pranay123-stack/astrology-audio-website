import { Fragment } from "react";
import { parseArticle, splitLinks, type Inline } from "@/lib/article";
import type { ArticleLang } from "@/lib/types";

/** Web addresses in the text open as links; the rest stays plain text. */
function Linked({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.link ? (
          <a key={i} href={part.text} target="_blank" rel="noopener noreferrer" className="break-all text-gold-soft underline">
            {part.text}
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold text-ink"><Linked text={p.text} /></strong>
        ) : (
          <Fragment key={i}><Linked text={p.text} /></Fragment>
        ),
      )}
    </>
  );
}

/** Renders an article with comfortable typography; `lang` lets browsers and screen readers handle Hindi correctly. */
export function ArticleBody({ source, lang }: { source: string; lang: ArticleLang }) {
  const blocks = parseArticle(source);
  return (
    <div lang={lang} className={`article-body ${lang === "hi" ? "article-hi" : ""}`} data-testid="article-body">
      {blocks.map((b, i) => {
        if (b.kind === "h2" || b.kind === "h3") {
          const Heading = b.kind;
          return <Heading key={i}><Text parts={b.content} /></Heading>;
        }
        if (b.kind === "ul")
          return (
            <ul key={i}>
              {b.items.map((it, j) => (
                <li key={j}><Text parts={it} /></li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {b.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Text parts={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
