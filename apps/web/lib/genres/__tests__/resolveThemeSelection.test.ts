import { describe, expect, it } from "vitest";
import { displayGenreLabel } from "../model";
import { resolveThemeSelection } from "../colors";

/**
 * Contract: `mirrorCountryTypeStripRight` only when the *right* Genre-strip label should echo
 * the same country pip/flag as the left. For world + *app genre* (e.g. ELECTRONIC), the right
 * pip is genre-coloured, so mirroring the country would wrongly show the flag twice.
 */
describe("resolveThemeSelection", () => {
  it("world-country-only: country header with no country-native subgenre keeps full country theme", () => {
    const r = resolveThemeSelection({ genre: "Germany", country: "Germany" });
    expect(r.selectionKind).toBe("world-country-only");
    expect(r.resolvedCountry).toBe("Germany");
    expect(r.leftLabel).toBe("Germany");
    expect(r.rightLabel).toBe("—");
    expect(r.flagStyle).toBeUndefined();
    expect(r.mirrorCountryTypeStripRight).toBe(true);
  });

  it("world-genre-only: country on left, app genre on right — do not mirror country to the right", () => {
    const r = resolveThemeSelection({ genre: "Electronic", country: "Spain" });
    expect(r.selectionKind).toBe("world-genre-only");
    expect(r.resolvedCountry).toBe("Spain");
    expect(r.resolvedGenre).toBe("Electronic");
    expect(r.leftLabel).toBe("Spain");
    expect(r.rightLabel).toBe("Electronic");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
    expect(r.flagStyle).toBe("fade");
  });

  it("world-genre-only: Mainstream + country", () => {
    const r = resolveThemeSelection({ genre: "Mainstream", country: "USA" });
    expect(r.selectionKind).toBe("world-genre-only");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
    expect(r.rightLabel).toBe("Pop");
  });

  it("world-blend-subgenre: subgenre on right — do not mirror country to the right", () => {
    const r = resolveThemeSelection({ genre: "Rap", country: "France" });
    expect(r.selectionKind).toBe("world-blend-subgenre");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
    expect(r.leftLabel).toBe("France");
    expect(r.rightLabel).toBe("Rap");
  });

  it("country-native: subgenre on right — mirror country pips", () => {
    const r = resolveThemeSelection({
      genre: "Folk Breton",
      country: "Britany",
    });
    expect(r.selectionKind).toBe("country-native");
    expect(r.mirrorCountryTypeStripRight).toBe(true);
    expect(r.leftLabel).toBe("Britany");
    expect(r.rightLabel).toBe("Folk Breton");
  });

  it("genre-subgenre: no country — no mirroring", () => {
    const r = resolveThemeSelection({ genre: "Pop Rock" });
    expect(r.selectionKind).toBe("genre-subgenre");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
  });

  it("genre-only: no country — no mirroring", () => {
    const r = resolveThemeSelection({ genre: "Rock" });
    expect(r.selectionKind).toBe("genre-only");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
    expect(r.leftLabel).toBe(displayGenreLabel("Rock"));
    expect(r.rightLabel).toBe("—");
  });

  it("genre-only: Mainstream uses Pop on left and Mainstream on right", () => {
    const r = resolveThemeSelection({ genre: "Mainstream" });
    expect(r.selectionKind).toBe("genre-only");
    expect(r.mirrorCountryTypeStripRight).toBe(false);
    expect(r.leftLabel).toBe("Pop");
    expect(r.rightLabel).toBe("Mainstream");
  });
});
