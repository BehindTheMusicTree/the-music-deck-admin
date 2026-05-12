import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT } from "../_card-helpers";

export const MEXICO_CARDS: CardData[] = [
  {
    catalogNumber: 1,
    id: 34,
    title: "La Cucaracha",
    artist: "",
    year: "1880",
    genre: "Mexican Folk",
    country: "Mexico",
    ability: "Reserve",
    abilityDesc: "Wishlist catalogue entry.",
    artworkOffsetY: -20,
    pop: 7,
    rarity: "BANGER",
    artwork: `${ART}artwork.la-cucaracha-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["artwork.la-cucaracha-v1.png"],
  },
];
