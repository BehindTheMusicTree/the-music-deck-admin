import { GENRE_NAMES } from "./genre-names";
import { SUBGENRES } from "./genre-subgenres";

const SUBGENRE_BY_NAME = new Map(SUBGENRES.map((s) => [s.n, s]));

function lookupPrintedCode(
  anchorGenreName: string,
  codeByAnchorName: ReadonlyMap<string, string>,
): string {
  const code = codeByAnchorName.get(anchorGenreName);
  if (!code) {
    throw new Error(
      `Printed set id: missing printedTypeCode in DB for taxonomy genre "${anchorGenreName}"`,
    );
  }
  return code;
}

/** Taxonomy genre row whose `printedTypeCode` defines TYPE for this stripe (country parent or root). */
function printedTypeAnchorForSongStripe(genreStripeLabel: string): string {
  const genre = genreStripeLabel?.trim();
  if (!genre) throw new Error("Printed set id: missing genre stripe");

  const def = SUBGENRE_BY_NAME.get(genre);
  if (def?.kind === "country") return def.parentA;
  if (def?.kind === "genre") return def.parentA;
  if ((GENRE_NAMES as readonly string[]).includes(genre)) return genre;

  throw new Error(
    `Printed set id: cannot resolve TYPE anchor for genre "${genre}"`,
  );
}

/** TYPE segment from `Genre.printedTypeCode` on the anchor taxonomy row. */
export function printedTypeCodeForSongCard(
  input: {
    genre: string;
    country?: string | null;
    title?: string;
    id?: number;
  },
  codeByAnchorName: ReadonlyMap<string, string>,
): string {
  const genre = input.genre?.trim();
  if (!genre) {
    throw new Error(
      `Printed set id: missing genre (${input.title ?? "?"}${input.id != null ? ` id ${input.id}` : ""})`,
    );
  }

  const def = SUBGENRE_BY_NAME.get(genre);
  if (def?.kind === "country") {
    const canonical = def.parentA;
    const c = input.country?.trim();
    if (c && c !== canonical) {
      throw new Error(
        `Printed set id: country stripe "${genre}" expects territory "${canonical}", got "${input.country}" (${input.title ?? "?"} ${input.id ?? ""})`,
      );
    }
  }

  const anchor = printedTypeAnchorForSongStripe(genre);
  return lookupPrintedCode(anchor, codeByAnchorName);
}

/** Leading TYPE letters/digits before first hyphen (e.g. `FR` from `FR-S1-007`). */
export function printedSetIdTypeSegment(printedSetId: string): string {
  const trimmed = printedSetId.trim();
  const dash = trimmed.indexOf("-");
  if (dash < 2) {
    throw new Error(
      `printedSetId must start with a TYPE segment of exactly two letters followed by a hyphen`,
    );
  }
  const seg = trimmed.slice(0, dash).toUpperCase();
  if (!/^[A-Z]{2}$/.test(seg)) {
    throw new Error(
      `printedSetId TYPE segment must be two ASCII letters, got "${trimmed.slice(0, dash)}"`,
    );
  }
  return seg;
}
