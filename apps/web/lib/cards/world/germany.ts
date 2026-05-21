import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const GERMANY_CARDS: CardData[] = [
  {
    catalogNumber: 15,
    id: 95,
    title: "Ich geh heut nicht mehr tanzen",
    artist: "Jannen May & ENNIO",
    year: "2016",
    genre: "Pop Rock",
    country: "Germany",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 7,
    rarity: "CLASSIC",
    artwork: `${ART}hannenmaykentereit-ich-geh-heut-nicht-mehr-tanzen-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT[
        "hannenmaykentereit-ich-geh-heut-nicht-mehr-tanzen-v1.png"
      ],
    ...(artworkPromptFor(95) ?? {}),
  },
];
