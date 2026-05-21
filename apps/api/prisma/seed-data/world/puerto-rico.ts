import type { CardData } from "@repo/cards-domain";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const PUERTO_RICO_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 36,
    title: "Despacito",
    artist: "",
    year: "2017",
    genre: "Reggaeton",
    country: "Puerto Rico",
    ability: "Viral",
    abilityDesc:
      "+10 popularity when played after another World or Mainstream card.",
    pop: 9,
    rarity: "LEGENDARY",
    artwork: `${ART}luiz-fonzi-despacito-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["luiz-fonzi-despacito-v1.png"],
    ...(artworkPromptFor(36) ?? {}),
  },
];
