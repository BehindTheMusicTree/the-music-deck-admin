import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const JAPAN_CARDS: CardData[] = [
  {
    catalogNumber: 14,
    id: 96,
    title: "Tokyo Drift",
    artist: "",
    year: "2006",
    genre: "Rap",
    country: "Japan",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 8,
    rarity: "BANGER",
    artwork: `${ART}teriyaki-boys-tokyo-drift-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["teriyaki-boys-tokyo-drift-v1.png"],
    ...(artworkPromptFor(96) ?? {}),
  },
];
