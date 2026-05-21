import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT } from "../_card-helpers";

export const NETHERLANDS_CARDS: CardData[] = [
  {
    catalogNumber: 13,
    id: 94,
    title: "Drank & Drugs",
    artist: "",
    year: "2015",
    genre: "Hip-House",
    country: "Netherlands",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 8,
    rarity: "BANGER",
    artwork: `${ART}lil-kleine-drank-drugs-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["lil-kleine-drank-drugs-v1.png"],
  },
];
