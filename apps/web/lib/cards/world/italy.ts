import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const ITALY_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 52,
    songsOut: [5],
    title: "Bella Ciao",
    year: "1880",
    genre: "Italian Folk",
    country: "Italy",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 7,
    rarity: "BANGER",
    artwork: `${ART}bella-ciao-original-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["bella-ciao-original-v1.png"],
    ...(artworkPromptFor(52) ?? {}),
  },
  {
    id: 69,
    title: "Blue (Da Ba Dee)",
    artist: "",
    year: "1999",
    genre: "Nu Italo",
    country: "Italy",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 8,
    rarity: "BANGER",
    artwork: `${ART}eiffel-65-blue-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["eiffel-65-blue-v1.png"],
    ...(artworkPromptFor(69) ?? {}),
    catalogNumber: 10,
  },
];
