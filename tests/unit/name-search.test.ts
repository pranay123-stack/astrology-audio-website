import { describe, expect, it } from "vitest";
import { searchByName } from "@/lib/name-search";

// The site's five player horoscopes.
const PLAYERS = ["Vaibhav Suryavanshi", "Virat Kohli", "Kieron Pollard", "Rohit Sharma", "Harbhajan Singh"];
const find = (q: string) => searchByName(PLAYERS, (p) => p, q);

describe("searchByName", () => {
  it("shows everyone until something is typed", () => {
    expect(find("")).toEqual(PLAYERS);
    expect(find("  ")).toEqual(PLAYERS);
  });

  it("one letter finds names with a word starting with it", () => {
    expect(find("v")).toEqual(["Vaibhav Suryavanshi", "Virat Kohli"]);
    expect(find("k")).toEqual(["Virat Kohli", "Kieron Pollard"]);
    expect(find("R")).toEqual(["Rohit Sharma"]);
  });

  it("two letters and more match anywhere in a name", () => {
    expect(find("ro")).toEqual(["Kieron Pollard", "Rohit Sharma"]);
    expect(find("shar")).toEqual(["Rohit Sharma"]);
    expect(find("virat kohli")).toEqual(["Virat Kohli"]);
    expect(find("kohli virat")).toEqual(["Virat Kohli"]);
  });

  it("finds misspelled names", () => {
    for (const [typed, name] of [
      ["kholi", "Virat Kohli"],
      ["virat kholi", "Virat Kohli"],
      ["rohith", "Rohit Sharma"],
      ["roheet", "Rohit Sharma"],
      ["pollord", "Kieron Pollard"],
      ["kiran pollard", "Kieron Pollard"],
      ["kiron", "Kieron Pollard"],
      ["harbajan", "Harbhajan Singh"],
      ["harbhajn", "Harbhajan Singh"],
      ["sooryavanshi", "Vaibhav Suryavanshi"],
      ["suryavansi", "Vaibhav Suryavanshi"],
      ["vaibav", "Vaibhav Suryavanshi"],
    ]) {
      expect(find(typed), typed).toEqual([name]);
    }
  });

  it("an exact match hides near misses", () => {
    expect(find("roh")).toEqual(["Rohit Sharma"]);
  });

  it("hides everyone when nothing is close", () => {
    expect(find("zzzz")).toEqual([]);
    expect(find("dhoni")).toEqual([]);
  });

  it("finds a name typed in Hindi", () => {
    expect(find("विराट")).toEqual(["Virat Kohli"]);
    expect(find("रोहित")).toEqual(["Rohit Sharma"]);
  });
});
