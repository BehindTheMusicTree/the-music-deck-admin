import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const REGGAE_DUB_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 4,
    title: "Is This Love",
    year: "1978",
    genre: "Roots",
    ability: "Roots",
    abilityDesc: "Heals 20 HP when adjacent to a World genre card.",
    pop: 8,
    rarity: "CLASSIC",
    artwork: `${ART}is-this-love-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["is-this-love-v1.png"],
  },
  {
    catalogNumber: 2,
    id: 104,
    songsOut: [105],
    title: "I Shot the Sherif",
    year: "1973",
    genre: "Roots",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 9,
    rarity: "LEGENDARY",
    artwork: `${ART}bob-marley-i-shot-the-sherif-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["bob-marley-i-shot-the-sherif-v1.png"],
    ...(artworkPromptFor(104) ?? {}),
  },
] as CardData[];
