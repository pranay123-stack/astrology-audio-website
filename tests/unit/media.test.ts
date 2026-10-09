import { describe, expect, it } from "vitest";
import { contentMatchesExtension, sniffFileType } from "@/lib/media/file-types";
import { parseRange } from "@/lib/media/range";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("parseRange", () => {
  it("returns null without a header", () => expect(parseRange(null, 100)).toBeNull());
  it("parses a closed range", () => expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 }));
  it("parses an open range", () => expect(parseRange("bytes=50-", 100)).toEqual({ start: 50, end: 99 }));
  it("parses a suffix range", () => expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 }));
  it("clamps the end to the file size", () => expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 }));
  it("flags ranges past the end", () => expect(parseRange("bytes=100-", 100)).toBe("unsatisfiable"));
  it("flags inverted ranges", () => expect(parseRange("bytes=20-10", 100)).toBe("unsatisfiable"));
  it("ignores multi-range requests", () => expect(parseRange("bytes=0-1,5-6", 100)).toBeNull());
});

describe("file signature sniffing", () => {
  it("recognises audio formats", () => {
    expect(sniffFileType(bytes("ID3", [3, 0]))).toBe("mp3");
    expect(sniffFileType(bytes([0xff, 0xfb, 0x90]))).toBe("mp3");
    expect(sniffFileType(bytes([0xff, 0xf1, 0x50]))).toBe("aac");
    expect(sniffFileType(bytes([0, 0, 0, 32], "ftypM4A "))).toBe("m4a");
    expect(sniffFileType(bytes("OggS", [0, 2]))).toBe("ogg");
    expect(sniffFileType(bytes("RIFF", [0, 0, 0, 0], "WAVE"))).toBe("wav");
  });

  it("recognises image formats", () => {
    expect(sniffFileType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffFileType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(sniffFileType(bytes("RIFF", [0, 0, 0, 0], "WEBP"))).toBe("webp");
    expect(sniffFileType(bytes([0, 0, 0, 28], "ftypavif"))).toBe("avif");
  });

  it("rejects disguised files", () => {
    const exe = bytes("MZ", [0x90, 0, 3, 0, 0, 0]);
    const html = bytes("<!DOCTYPE html>");
    expect(contentMatchesExtension(exe, "mp3")).toBe(false);
    expect(contentMatchesExtension(html, "png")).toBe(false);
    expect(contentMatchesExtension(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "mp3")).toBe(false);
    expect(contentMatchesExtension(bytes([0, 0, 0, 28], "ftypavif"), "m4a")).toBe(false);
  });

  it("accepts matching content", () => {
    expect(contentMatchesExtension(bytes("ID3", [3, 0]), "mp3")).toBe(true);
    expect(contentMatchesExtension(bytes([0xff, 0xd8, 0xff, 0xe0]), "jpg")).toBe(true);
  });
});
