import { CARD_ARTWORK_PROMPTS } from "./artwork-prompts";
import type { CardData } from "@/components/cards/Card";
import {
  type RootGenreName,
  displayGenreLabel,
  isCountrySubgenre,
  resolveThemeSelection,
} from "@/lib/genres";
export { ARTWORK_CREATED_AT } from "./artwork-created-at";
export { CARD_ARTWORK_BASE as ART } from "./art-path";

export function artworkPromptFor(
  id: number,
): { artworkPrompt: string } | undefined {
  const s = CARD_ARTWORK_PROMPTS[id];
  return s ? { artworkPrompt: s } : undefined;
}

export function deriveCatalogSeriesLabel(
  card: Pick<CardData, "id" | "title" | "genre" | "country">,
): string {
  const { genre, country, title, id } = card;
  if (!genre) {
    throw new Error(
      `Shipped card "${title}" (id ${id}): set genre to derive catalog series`,
    );
  }
  if (isCountrySubgenre(genre)) {
    if (!country) {
      throw new Error(
        `Shipped card "${title}" (id ${id}): country-native genre "${genre}" requires country`,
      );
    }
    return country;
  }
  const resolved = resolveThemeSelection({ genre, country });
  if (!resolved.resolvedGenre) {
    throw new Error(
      `Shipped card "${title}" (id ${id}): cannot resolve app genre from "${genre}"`,
    );
  }
  return displayGenreLabel(resolved.resolvedGenre as RootGenreName);
}
