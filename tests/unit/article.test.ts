import { describe, expect, it } from "vitest";
import { parseArticle, parseInline, readingMinutes } from "@/lib/article";

describe("article formatting", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    const blocks = parseArticle("पहला अनुच्छेद\nदूसरी पंक्ति\n\nदूसरा अनुच्छेद");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: "p" });
    expect(blocks[0].kind === "p" && blocks[0].lines.map((l) => l[0].text)).toEqual(["पहला अनुच्छेद", "दूसरी पंक्ति"]);
  });

  it("recognises headings, including a heading followed by text in the same block", () => {
    const blocks = parseArticle("## शनि ग्रह\nशनि का स्वभाव\n\n### उपाय");
    expect(blocks.map((b) => b.kind)).toEqual(["h2", "p", "h3"]);
  });

  it("turns -, • and * lines into a bullet list", () => {
    const [b] = parseArticle("- पहला\n• दूसरा\n* तीसरा");
    expect(b.kind).toBe("ul");
    expect(b.kind === "ul" && b.items.map((i) => i[0].text)).toEqual(["पहला", "दूसरा", "तीसरा"]);
  });

  it("supports **bold** inline", () => {
    expect(parseInline("यह **महत्वपूर्ण** है")).toEqual([
      { text: "यह ", bold: false },
      { text: "महत्वपूर्ण", bold: true },
      { text: " है", bold: false },
    ]);
  });

  it("keeps pasted HTML as plain text (rendered escaped by React, never as markup)", () => {
    const [b] = parseArticle('<script>alert("x")</script> <img src=x onerror=alert(1)>');
    expect(b.kind === "p" && b.lines[0][0].text).toBe('<script>alert("x")</script> <img src=x onerror=alert(1)>');
  });

  it("handles Windows line endings and stray whitespace", () => {
    expect(parseArticle("एक\r\n\r\n   \r\nदो").map((b) => b.kind)).toEqual(["p", "p"]);
  });

  it("estimates reading time with a one-minute floor", () => {
    expect(readingMinutes("शब्द ".repeat(10))).toBe(1);
    expect(readingMinutes("शब्द ".repeat(900))).toBe(5);
  });
});
