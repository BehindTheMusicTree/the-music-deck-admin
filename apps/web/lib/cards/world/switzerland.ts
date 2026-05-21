import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const SWITZERLAND_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 97,
    title: "Zäuerli d’Appenzell (Appenzell yodel)",
    artist: "",
    year: "18th century",
    genre: "Yodel",
    country: "Switzerland",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 6,
    rarity: "CLASSIC",
    artwork: `${ART}e-gschankte-tag-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["e-gschankte-tag-v1.png"],
    ...(artworkPromptFor(97) ?? {}),
  },
];
