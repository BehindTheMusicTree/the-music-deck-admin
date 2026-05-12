import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const ALGERIA_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 35,
    title: "Abdel Kader",
    artist: "",
    year: "1998",
    genre: "Raï",
    country: "Algeria",
    ability: "Caravan",
    abilityDesc:
      "Allied World cards gain +4 popularity when this card enters play.",
    pop: 8,
    rarity: "CLASSIC",
    artwork: `${ART}artwork.un-deux-trois-soleil-abdel-kader-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["artwork.un-deux-trois-soleil-abdel-kader-v1.png"],
    ...(artworkPromptFor(35) ?? {}),
  },
  {
    catalogNumber: 2,
    id: 82,
    title: "Shaft",
    artist: "",
    year: "1993",
    country: "Algeria",
    genre: "Disco",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 6,
    rarity: "BANGER",
    artwork: `${ART}artwork.shaft-malik-adouane-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["artwork.shaft-malik-adouane-v1.png"],
    artworkOffsetY: -25,
    ...(artworkPromptFor(82) ?? {}),
  },
];
