import { describe, expect, it } from "vitest";
import { decideMediaAccess } from "@/lib/access";
import { lengthLabel } from "@/lib/episodes";
import { contentMatchesExtension, sniffFileType } from "@/lib/media/file-types";
import { parseGoogleForm } from "@/lib/google-form";
import { parseDriveLink } from "@/lib/media/drive-link";
import { parseVideoLink } from "@/lib/media/video-link";
import { episodeInputSchema } from "@/lib/validation";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("parseVideoLink", () => {
  it("embeds YouTube videos and Shorts from any common link form", () => {
    const watch = parseVideoLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s");
    expect(watch).toMatchObject({ provider: "youtube", vertical: false, embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0" });
    expect(parseVideoLink("https://youtu.be/dQw4w9WgXcQ?si=abc")?.embedUrl).toContain("/embed/dQw4w9WgXcQ");
    expect(parseVideoLink("https://m.youtube.com/watch?v=dQw4w9WgXcQ")?.provider).toBe("youtube");
    const short = parseVideoLink("https://youtube.com/shorts/dQw4w9WgXcQ?feature=share");
    expect(short).toMatchObject({ vertical: true, watchUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ" });
  });

  it("embeds Instagram reels and posts", () => {
    expect(parseVideoLink("https://www.instagram.com/reel/C8xYz12AbCd/?igsh=xyz")).toMatchObject({
      provider: "instagram",
      vertical: true,
      embedUrl: "https://www.instagram.com/reel/C8xYz12AbCd/embed",
    });
    expect(parseVideoLink("https://instagram.com/reels/C8xYz12AbCd")?.embedUrl).toBe("https://www.instagram.com/reel/C8xYz12AbCd/embed");
    expect(parseVideoLink("https://www.instagram.com/astrocricket/p/C8xYz12AbCd/")).toMatchObject({ vertical: false });
  });

  it("rejects everything else", () => {
    for (const bad of [
      "",
      "not a url",
      "javascript:alert(1)",
      "https://evil.example/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/@channel",
      "https://www.instagram.com/astrocricket/",
    ]) {
      expect(parseVideoLink(bad), bad).toBeNull();
    }
  });
});

describe("video file signatures", () => {
  it("accepts MP4/MOV (ISO base media) and WebM, and nothing renamed", () => {
    const mp4 = bytes([0, 0, 0, 32], "ftypisom");
    const mov = bytes([0, 0, 0, 20], "ftypqt  ");
    const webm = bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f]);
    expect(contentMatchesExtension(mp4, "mp4")).toBe(true);
    expect(contentMatchesExtension(mov, "mov")).toBe(true);
    expect(sniffFileType(webm)).toBe("webm");
    expect(contentMatchesExtension(webm, "webm")).toBe(true);
    expect(contentMatchesExtension(bytes("MZ", [0x90, 0]), "mp4")).toBe(false);
    expect(contentMatchesExtension(webm, "mp4")).toBe(false);
    expect(contentMatchesExtension(bytes([0xff, 0xd8, 0xff, 0xe0]), "webm")).toBe(false);
  });
});

describe("episode validation: video and gallery", () => {
  const valid = {
    title: "A valid title",
    excerpt: "A short description here",
    category_id: "c",
    audio_storage_path: null,
    cover_image_path: null,
    duration_seconds: 0,
    is_published: true,
    is_premium: false,
    match: null,
  };
  const g = (n: number) => `gallery/0f8fad5b-d9cb-469f-a165-${String(n).padStart(12, "0")}.jpg`;

  it("accepts uploaded video, a known link and a gallery", () => {
    const r = episodeInputSchema.safeParse({
      ...valid,
      video_storage_path: "video/0f8fad5b-d9cb-469f-a165-70867728950e.mp4",
      video_format: "reel",
      video_link: "https://youtu.be/dQw4w9WgXcQ",
      gallery_paths: [g(1), g(2)],
    });
    expect(r.success).toBe(true);
    expect(r.data?.gallery_paths).toHaveLength(2);
  });

  it("defaults to no video and an empty gallery", () => {
    expect(episodeInputSchema.parse(valid)).toMatchObject({ video_storage_path: null, video_format: "video", video_link: "", gallery_paths: [] });
  });

  it("rejects unknown links, formats, foreign paths and oversized galleries", () => {
    expect(episodeInputSchema.safeParse({ ...valid, video_link: "https://vimeo.com/123" }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ ...valid, video_format: "story" }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ ...valid, video_storage_path: "video/../x.mp4" }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ ...valid, gallery_paths: ["https://evil.example/a.jpg"] }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ ...valid, gallery_paths: Array.from({ length: 13 }, (_, i) => g(i)) }).success).toBe(false);
  });
});

describe("decideMediaAccess (video)", () => {
  const NOW = Date.parse("2026-10-25T00:00:00Z");
  const base = { is_published: true, published_at: "2026-10-01T00:00:00Z", is_premium: false, audio_storage_path: null, video_storage_path: "video/x.mp4" };
  const visitor = { isAdmin: false, hasPremiumAccess: false };

  it("streams free video, locks premium video, 404s when there is none", () => {
    expect(decideMediaAccess(base, "video", visitor, false, NOW)).toEqual({ allowed: true });
    expect(decideMediaAccess({ ...base, is_premium: true }, "video", visitor, false, NOW)).toMatchObject({ status: 403, reason: /Premium video/ });
    expect(decideMediaAccess({ ...base, is_premium: true }, "video", { isAdmin: true, hasPremiumAccess: false }, false, NOW)).toEqual({ allowed: true });
    expect(decideMediaAccess({ ...base, video_storage_path: null }, "video", visitor, false, NOW)).toMatchObject({ status: 404 });
    // The audio rule does not open the video, and vice versa.
    expect(decideMediaAccess(base, "audio", visitor, false, NOW)).toMatchObject({ status: 404 });
  });
});

describe("lengthLabel", () => {
  const e = {
    audio_storage_path: null,
    article: "",
    has_article: false,
    duration_seconds: 0,
    video_storage_path: null,
    video_link: "https://youtu.be/dQw4w9WgXcQ",
    video_format: "reel" as const,
    gallery_paths: ["gallery/a.jpg", "gallery/b.jpg", "gallery/c.jpg"],
  };
  it("names reels and counts photos in both languages", () => {
    expect(lengthLabel(e, "en")).toBe("Reel · 3 photos");
    expect(lengthLabel({ ...e, video_format: "video", gallery_paths: ["gallery/a.jpg"] }, "en")).toBe("Video · 1 photo");
    expect(lengthLabel(e, "hi")).toBe("रील · 3 फ़ोटो");
  });
});

describe("parseDriveLink", () => {
  const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
  it("reads the file id from the usual Drive share links", () => {
    for (const link of [
      `https://drive.google.com/file/d/${ID}/view?usp=sharing`,
      `https://drive.google.com/file/d/${ID}/view?usp=drive_link`,
      `https://drive.google.com/file/u/0/d/${ID}/view`,
      `https://drive.google.com/open?id=${ID}`,
      `https://drive.google.com/uc?id=${ID}&export=download`,
    ]) {
      expect(parseDriveLink(link), link).toEqual({
        fileId: ID,
        embedUrl: `https://drive.google.com/file/d/${ID}/preview`,
        viewUrl: `https://drive.google.com/file/d/${ID}/view`,
      });
    }
  });
  it("rejects folders, other sites and junk", () => {
    for (const bad of [
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz",
      `https://evil.example/file/d/${ID}/view`,
      "https://drive.google.com/file/d/short/view",
      "not a link",
    ]) {
      expect(parseDriveLink(bad), bad).toBeNull();
    }
  });
});

describe("parseGoogleForm", () => {
  const PUB = "1FAIpQLSdAbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdEFG";
  it("embeds a full Google Forms link and keeps short links as a button", () => {
    expect(parseGoogleForm(`https://docs.google.com/forms/d/e/${PUB}/viewform?usp=sf_link`)).toEqual({
      embedUrl: `https://docs.google.com/forms/d/e/${PUB}/viewform?embedded=true`,
      openUrl: `https://docs.google.com/forms/d/e/${PUB}/viewform`,
    });
    expect(parseGoogleForm(`https://docs.google.com/forms/d/e/${PUB}/viewform?embedded=true`)?.embedUrl).toContain("embedded=true");
    expect(parseGoogleForm("https://forms.gle/AbC123xYz789")).toEqual({ embedUrl: null, openUrl: "https://forms.gle/AbC123xYz789" });
  });
  it("rejects edit links of other sites and plain Google pages", () => {
    expect(parseGoogleForm("https://docs.google.com/document/d/abc/edit")).toBeNull();
    expect(parseGoogleForm(`https://evil.example/forms/d/e/${PUB}/viewform`)).toBeNull();
    expect(parseGoogleForm(`http://docs.google.com/forms/d/e/${PUB}/viewform`)).toBeNull();
  });
});
