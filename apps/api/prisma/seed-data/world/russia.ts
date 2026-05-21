import type { CardData } from "@repo/cards-domain";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const RUSSIA_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 98,
    title: "Kalinka",
    artist: "Ivan Larionov",
    year: "1860",
    genre: "Russian Folk",
    country: "Russia",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 7,
    rarity: "CLASSIC",
    artwork: `${ART}ivan-larionov-kalinka-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["ivan-larionov-kalinka-v1.png"],
    ...(artworkPromptFor(98) ?? {}),
  },
  {
    id: 99,
    title: "Kalinka",
    artist: "Army Choir",
    year: "2010",
    genre: "Russian Folk",
    country: "Russia",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 7,
    rarity: "CLASSIC",
    artwork: `${ART}red-army-choir-kalinka-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["red-army-choir-kalinka-v1.png"],
    ...(artworkPromptFor(99) ?? {}),
    catalogNumber: 2,
  },
];
