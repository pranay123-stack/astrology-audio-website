import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapterTitle, chaptersFromFolder, parseDriveFolderLink, parseDriveFolderPage } from "@/lib/media/drive-folder";
import { parseDriveLink } from "@/lib/media/drive-link";
import { episodeInputSchema } from "@/lib/validation";

// Drive's public page for the astrologer's audiobook folder, saved 2026-10-30.
const PAGE = readFileSync(new URL("../fixtures/drive-folder-audiobook.html", import.meta.url), "utf8");
const FOLDER = "1pSZD-RDJ7Dj0A4t5q7fCRQyOhY5uthz4";

describe("parseDriveFolderLink", () => {
  it("reads the id from folder share links", () => {
    for (const link of [
      `https://drive.google.com/drive/folders/${FOLDER}`,
      `https://drive.google.com/drive/folders/${FOLDER}?usp=sharing`,
      `https://drive.google.com/drive/u/0/folders/${FOLDER}`,
    ]) expect(parseDriveFolderLink(link)).toBe(FOLDER);
  });

  it("rejects file links and other sites", () => {
    expect(parseDriveFolderLink(`https://drive.google.com/file/d/${FOLDER}/view`)).toBeNull();
    expect(parseDriveFolderLink(`https://example.com/drive/folders/${FOLDER}`)).toBeNull();
    expect(parseDriveFolderLink("not a link")).toBeNull();
  });
});

describe("audiobook folder → chapters", () => {
  it("lists every file on the real folder page", () => {
    const entries = parseDriveFolderPage(PAGE);
    expect(entries).toHaveLength(17);
    expect(entries[0]).toEqual({ fileId: "1QFNwNCRuOBrR79nzCuS1eTuVfoNrD6Zk", name: "Chapter-01.mp3", mimeType: "audio/mpeg" });
  });

  it("orders opening credit, chapters 1–14 by number, then the ending credit", () => {
    const chapters = chaptersFromFolder(parseDriveFolderPage(PAGE));
    expect(chapters.map((c) => c.title)).toEqual([
      "Opning credit",
      ...Array.from({ length: 14 }, (_, i) => `Chapter ${String(i + 1).padStart(2, "0")}`),
      "Ending credit",
      "Retail sample",
    ]);
    for (const c of chapters) expect(parseDriveLink(c.link)).not.toBeNull();
    expect(chapters[1].link).toBe("https://drive.google.com/file/d/1QFNwNCRuOBrR79nzCuS1eTuVfoNrD6Zk/view");
  });

  it("keeps only audio files and puts chapter 2 before chapter 10", () => {
    const chapters = chaptersFromFolder([
      { fileId: "a".repeat(33), name: "Chapter 10.mp3", mimeType: "audio/mpeg" },
      { fileId: "b".repeat(33), name: "cover.jpg", mimeType: "image/jpeg" },
      { fileId: "c".repeat(33), name: "Chapter 2.m4a", mimeType: "" },
    ]);
    expect(chapters.map((c) => c.title)).toEqual(["Chapter 2", "Chapter 10"]);
  });

  it("tidies file names into chapter names", () => {
    expect(chapterTitle("chapter-06 .mp3")).toBe("Chapter 06");
    expect(chapterTitle("ending_credit.MP3")).toBe("Ending credit");
  });
});

describe("audio_chapters input", () => {
  const base = {
    title: "Audiobook", slug: "", excerpt: "The whole book, read aloud.", description: "", article: "", category_id: "c",
    audio_storage_path: null, cover_image_path: null, duration_seconds: 0, is_published: true, is_premium: false, match: null,
  };
  const chapters = chaptersFromFolder(parseDriveFolderPage(PAGE));

  it("accepts the folder's chapters", () => {
    expect(episodeInputSchema.safeParse({ ...base, audio_link: chapters[0].link, audio_chapters: chapters }).success).toBe(true);
  });

  it("rejects an empty chapter name, a non-Drive link, and an uploaded file next to chapters", () => {
    expect(episodeInputSchema.safeParse({ ...base, audio_chapters: [{ ...chapters[0], title: " " }] }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ ...base, audio_chapters: [{ title: "One", link: "https://example.com/a.mp3" }] }).success).toBe(false);
    const both = episodeInputSchema.safeParse({ ...base, audio_storage_path: "audio/x.mp3", audio_chapters: chapters });
    expect(both.success).toBe(false);
    expect(both.error?.issues[0].path).toEqual(["audio_storage_path"]);
  });
});
