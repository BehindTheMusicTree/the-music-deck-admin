import { describe, expect, it } from "vitest";
import type { CardData } from "@/components/cards/Card";
import { buildCardSongIndex, deriveSongsInFromSongIndex } from "./song-graph";

const cards: CardData[] = [
  {
    id: 1,
    title: "A",
    genre: "Rock",
    year: "2000",
    ability: "Reserve",
    abilityDesc: "Test",
    pop: 5,
    rarity: "CLASSIC",
    songsOut: [2, 3],
  },
  {
    id: 2,
    title: "B",
    genre: "Rock",
    year: "2001",
    ability: "Reserve",
    abilityDesc: "Test",
    pop: 5,
    rarity: "CLASSIC",
    songsOut: [3],
  },
  {
    id: 3,
    title: "C",
    genre: "Rock",
    year: "2002",
    ability: "Reserve",
    abilityDesc: "Test",
    pop: 5,
    rarity: "CLASSIC",
  },
];

describe("deriveSongsInFromSongIndex", () => {
  it("derives incoming ids only from other cards songsOut", () => {
    const index = buildCardSongIndex(cards);

    expect(deriveSongsInFromSongIndex(index, 1)).toEqual([]);
    expect(deriveSongsInFromSongIndex(index, 2)).toEqual([1]);
    expect(deriveSongsInFromSongIndex(index, 3)).toEqual([1, 2]);
  });
});
