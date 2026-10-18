import { describe, expect, it } from "vitest";
import { handleFromUrl, whatsappNumber } from "@/components/layout/ContactChannels";

describe("whatsappNumber", () => {
  it("formats an Indian wa.me link", () => {
    expect(whatsappNumber("https://wa.me/918981345111")).toBe("+91 89813 45111");
  });
  it("reads the phone parameter of an api.whatsapp.com link", () => {
    expect(whatsappNumber("https://api.whatsapp.com/send?phone=918981345111")).toBe("+91 89813 45111");
  });
  it("keeps other countries as plain international digits", () => {
    expect(whatsappNumber("https://wa.me/61412345678")).toBe("+61412345678");
  });
  it("returns null for links without a number or invalid URLs", () => {
    expect(whatsappNumber("https://wa.me/")).toBeNull();
    expect(whatsappNumber("not a url")).toBeNull();
  });
});

describe("handleFromUrl", () => {
  it("prefixes the first path segment with @", () => {
    expect(handleFromUrl("https://t.me/astcr")).toBe("@astcr");
    expect(handleFromUrl("https://www.youtube.com/@ASTROCRICKET")).toBe("@ASTROCRICKET");
  });
});
