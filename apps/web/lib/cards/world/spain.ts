import type { CardData } from "@/components/cards/Card";
import { ART, ARTWORK_CREATED_AT, artworkPromptFor } from "../_card-helpers";

export const SPAIN_CARDS: CardData[] = [
  {
    catalogNumber: 2,
    id: 25,
    title: "Cannabis",
    artist: "",
    year: "1998",
    genre: "Ska Punk",
    ability: "Contraband",
    abilityDesc:
      "Opponent discards one card at random when this card enters play.",
    pop: 6,
    rarity: "BANGER",
    country: "Spain",
    artwork: `${ART}ska-p-cannabis-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["ska-p-cannabis-v1.png"],
  },
  {
    id: 30,
    title: "The Ketchup Song (Aserejé)",
    artist: "Las Ketchup",
    year: "2002",
    genre: "Disco Pop",
    country: "Spain",
    ability: "Choreography",
    abilityDesc: "+8 popularity when played after another dance track.",
    pop: 9,
    rarity: "BANGER",
    artwork: `${ART}las-ketchup-the-ketchup-song-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["las-ketchup-the-ketchup-song-v1.png"],
    catalogNumber: 3,
  },
  {
    id: 64,
    title: "Me Gustas Tú",
    artist: "Manu Chao",
    year: "2001",
    genre: "Roots",
    country: "Spain",
    ability: "Reserve",
    abilityDesc: "Shipped catalogue entry.",
    pop: 8,
    rarity: "BANGER",
    artwork: `${ART}me-gustas-tu-v1.png`,
    artworkCreatedAt: ARTWORK_CREATED_AT["me-gustas-tu-v1.png"],
    catalogNumber: 2,
  },
];
