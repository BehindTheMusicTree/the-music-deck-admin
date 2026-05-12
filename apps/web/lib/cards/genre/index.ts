import type { CardData } from "@/components/cards/Card";
import { CLASSICAL_CARDS } from "./classical";
import { DISCO_FUNK_CARDS } from "./disco-funk";
import { ELECTRONIC_CARDS } from "./electronic";
import { HIP_HOP_CARDS } from "./hip-hop";
import { MAINSTREAM_CARDS } from "./mainstream";
import { REGGAE_DUB_CARDS } from "./reggae-dub";
import { ROCK_CARDS } from "./rock";
import { VINTAGE_CARDS } from "./vintage";

export const ALL_GENRE_CARDS: CardData[] = [
  ...ROCK_CARDS,
  ...ELECTRONIC_CARDS,
  ...HIP_HOP_CARDS,
  ...DISCO_FUNK_CARDS,
  ...VINTAGE_CARDS,
  ...CLASSICAL_CARDS,
  ...REGGAE_DUB_CARDS,
  ...MAINSTREAM_CARDS,
];

const _catalogGenreRepresentativeIds = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

/** All genre cards except the 8 representative rows already handled separately in `catalog.ts` (`rawGenreRows`). */
export const DECK_ADDITIONAL_GENRE_CARDS: CardData[] = ALL_GENRE_CARDS.filter(
  (c) => !_catalogGenreRepresentativeIds.has(c.id),
);
