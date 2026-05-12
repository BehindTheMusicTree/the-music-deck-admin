import type { CardData } from "@/components/cards/Card";
import { ARTWORK_CREATED_AT } from "@/lib/cards/artwork-created-at";

/** Default card for genre / theme preview tooling. */
export const DEFAULT_PREVIEW_CARD: CardData = {
  id: 9000,
  title: "Preview Song",
  artist: "Artist",
  year: "2024",
  genre: "Disco Pop",
  ability: "Preview",
  abilityDesc: "Live preview of the selected genre or subgenre theme.",
  pop: 7,
  rarity: "CLASSIC",
  artwork: "/cards/artworks/deck/artwork.bohemian-rhapsody-v2.png",
  artworkCreatedAt: ARTWORK_CREATED_AT["artwork.bohemian-rhapsody-v2.png"],
  artworkPrompt:
    "1970s rock opera single cover, dramatic stage lighting, vinyl-era palette.",
};
