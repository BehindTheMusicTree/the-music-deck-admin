import type { Intensity } from "./card-data";
import type { NonMainstreamGenreName } from "./genre-names";

export function intensityLevelIndex(level: Intensity): number {
  if (level === "POP") return 1;
  if (level === "SOFT") return 2;
  if (level === "EXPERIMENTAL") return 3;
  return 4;
}

interface BaseSubgenre {
  n: string;
  color?: string;
  /** parentA is NonMainstreamGenreName for genre-linked, country name string for country-linked. */
  parentA: string;
  parentB?: NonMainstreamGenreName;
  intensity: Intensity;
  influence?: {
    genre: NonMainstreamGenreName;
    intensity: Intensity;
  };
}

export interface GenreSubgenre extends BaseSubgenre {
  kind: "genre";
  parentA: NonMainstreamGenreName;
}

export interface CountrySubgenre extends BaseSubgenre {
  kind: "country";
  parentB?: never;
}

export type Subgenre = GenreSubgenre | CountrySubgenre;

export const SUBGENRES: Subgenre[] = [
  { kind: "country", n: "Country", parentA: "USA", intensity: "SOFT" },
  { kind: "country", n: "American Folk", parentA: "USA", intensity: "SOFT" },
  { kind: "country", n: "Spiritual", parentA: "USA", intensity: "SOFT" },
  { kind: "country", n: "Gospel", parentA: "USA", intensity: "SOFT" },
  {
    kind: "country",
    n: "French Variety",
    parentA: "France",
    intensity: "SOFT",
  },
  { kind: "country", n: "French Folk", parentA: "France", intensity: "SOFT" },
  { kind: "country", n: "Folk Breton", parentA: "Britany", intensity: "SOFT" },
  { kind: "country", n: "Flamenco", parentA: "Spain", intensity: "SOFT" },
  {
    kind: "country",
    n: "Neapolitan Song",
    parentA: "Italy",
    intensity: "SOFT",
  },
  { kind: "country", n: "Italian Folk", parentA: "Italy", intensity: "SOFT" },
  { kind: "country", n: "Japanese Folk", parentA: "Japan", intensity: "SOFT" },
  { kind: "country", n: "English Folk", parentA: "England", intensity: "SOFT" },
  { kind: "country", n: "Raï", parentA: "Algeria", intensity: "SOFT" },
  { kind: "country", n: "Reggaeton", parentA: "Puerto Rico", intensity: "POP" },
  { kind: "country", n: "Mexican Folk", parentA: "Mexico", intensity: "SOFT" },
  { kind: "country", n: "Yodel", parentA: "Switzerland", intensity: "SOFT" },
  { kind: "country", n: "Peruvian Cumbia", parentA: "Peru", intensity: "POP" },
  { kind: "country", n: "Russian Folk", parentA: "Russia", intensity: "SOFT" },
  { kind: "genre", n: "Electropop", parentA: "Electronic", intensity: "POP" },
  { kind: "genre", n: "Dance Pop", parentA: "Electronic", intensity: "POP" },
  {
    kind: "genre",
    n: "New Wave",
    parentA: "Electronic",
    intensity: "POP",
    influence: { genre: "Rock", intensity: "POP" },
  },
  { kind: "genre", n: "Disco Pop", parentA: "Disco/Funk", intensity: "POP" },
  {
    kind: "genre",
    n: "Pop Rock",
    parentA: "Rock",
    intensity: "POP",
    influence: { genre: "Vintage", intensity: "POP" },
  },
  {
    kind: "genre",
    n: "Chamber Pop",
    parentA: "Rock",
    intensity: "POP",
    influence: { genre: "Classical", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Early Pop Rock",
    parentA: "Rock",
    intensity: "POP",
    influence: { genre: "Vintage", intensity: "POP" },
  },
  { kind: "genre", n: "Soul Rock", parentA: "Rock", intensity: "POP" },
  {
    kind: "genre",
    n: "Soft Rock",
    parentA: "Rock",
    intensity: "SOFT",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Blues Rock",
    parentA: "Rock",
    intensity: "SOFT",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  { kind: "genre", n: "Krautrock", parentA: "Rock", intensity: "SOFT" },
  {
    kind: "genre",
    n: "Post Grunge",
    parentA: "Rock",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Opera Rock",
    parentA: "Rock",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Classical", intensity: "HARDCORE" },
  },
  { kind: "genre", n: "EDM", parentA: "Electronic", intensity: "SOFT" },
  { kind: "genre", n: "Rap", parentA: "Hip-Hop", intensity: "EXPERIMENTAL" },
  {
    kind: "genre",
    n: "Turntablism",
    parentA: "Electronic",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Hip-Hop", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Hip-House",
    parentA: "Hip-Hop",
    intensity: "SOFT",
    influence: { genre: "Electronic", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "R&B",
    parentA: "Hip-Hop",
    intensity: "SOFT",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Roots",
    parentA: "Reggae/Dub",
    intensity: "SOFT",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  { kind: "genre", n: "Disco", parentA: "Disco/Funk", intensity: "SOFT" },
  {
    kind: "genre",
    n: "Funk",
    parentA: "Disco/Funk",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Early Funk",
    parentA: "Disco/Funk",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Funk Soul",
    parentA: "Disco/Funk",
    intensity: "SOFT",
    influence: { genre: "Vintage", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Ska Punk",
    parentA: "Rock",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Reggae/Dub", intensity: "EXPERIMENTAL" },
  },
  { kind: "genre", n: "Punk Rock", parentA: "Rock", intensity: "EXPERIMENTAL" },
  { kind: "genre", n: "Grunge", parentA: "Rock", intensity: "HARDCORE" },
  {
    kind: "genre",
    n: "Alternative Rock",
    parentA: "Rock",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Prog Rock",
    parentA: "Rock",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Classical", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Dub",
    parentA: "Reggae/Dub",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Electronic", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Drum & Bass",
    parentA: "Electronic",
    intensity: "HARDCORE",
  },
  {
    kind: "genre",
    n: "Peak Time Techno",
    parentA: "Electronic",
    intensity: "HARDCORE",
  },
  {
    kind: "genre",
    n: "Hard Techno",
    parentA: "Electronic",
    intensity: "HARDCORE",
  },
  {
    kind: "genre",
    n: "Jungle",
    parentA: "Electronic",
    parentB: "Reggae/Dub",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Reggae/Dub", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Techno",
    parentA: "Electronic",
    intensity: "EXPERIMENTAL",
  },
  { kind: "genre", n: "Nu Italo", parentA: "Electronic", intensity: "SOFT" },
  {
    kind: "genre",
    n: "House",
    parentA: "Electronic",
    intensity: "SOFT",
    influence: { genre: "Disco/Funk", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "French House",
    parentA: "Electronic",
    intensity: "SOFT",
    influence: { genre: "Disco/Funk", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Progressive House",
    parentA: "Electronic",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Cantique",
    parentA: "Vintage",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Classical", intensity: "SOFT" },
  },
  {
    kind: "genre",
    n: "Anthem",
    parentA: "Classical",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Jazz",
    parentA: "Vintage",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Classical", intensity: "EXPERIMENTAL" },
  },
  { kind: "genre", n: "Soul Jazz", parentA: "Vintage", intensity: "SOFT" },
  { kind: "genre", n: "Soul", parentA: "Vintage", intensity: "EXPERIMENTAL" },
  {
    kind: "genre",
    n: "Hard Rock",
    parentA: "Rock",
    intensity: "HARDCORE",
    influence: { genre: "Vintage", intensity: "EXPERIMENTAL" },
  },
  { kind: "genre", n: "Punk", parentA: "Rock", intensity: "HARDCORE" },
  {
    kind: "genre",
    n: "Metal",
    parentA: "Rock",
    intensity: "HARDCORE",
    influence: { genre: "Classical", intensity: "HARDCORE" },
  },
  {
    kind: "genre",
    n: "Nu Metal",
    parentA: "Rock",
    intensity: "HARDCORE",
    influence: { genre: "Hip-Hop", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Free Jazz",
    parentA: "Vintage",
    intensity: "HARDCORE",
    influence: { genre: "Classical", intensity: "HARDCORE" },
  },
  {
    kind: "genre",
    n: "Psytrance",
    parentA: "Electronic",
    intensity: "HARDCORE",
  },
  {
    kind: "genre",
    n: "Minimal",
    parentA: "Electronic",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Cloud Rap",
    parentA: "Hip-Hop",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Electronic", intensity: "EXPERIMENTAL" },
  },
  {
    kind: "genre",
    n: "Alternative Hip-Hop",
    parentA: "Hip-Hop",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Progressive Hip-Hop",
    parentA: "Hip-Hop",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Trap",
    parentA: "Hip-Hop",
    intensity: "EXPERIMENTAL",
    influence: { genre: "Electronic", intensity: "HARDCORE" },
  },
  {
    kind: "genre",
    n: "Gangsta Rap",
    parentA: "Hip-Hop",
    intensity: "HARDCORE",
  },
  { kind: "genre", n: "Christian Hymn", parentA: "Vintage", intensity: "SOFT" },
  {
    kind: "genre",
    n: "Baroque Classical",
    parentA: "Classical",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Romantic Classical",
    parentA: "Classical",
    intensity: "EXPERIMENTAL",
  },
  {
    kind: "genre",
    n: "Impressionist Classical",
    parentA: "Classical",
    intensity: "SOFT",
  },
  {
    kind: "genre",
    n: "Virtuoso Piano",
    parentA: "Classical",
    intensity: "HARDCORE",
  },
  { kind: "genre", n: "Opera", parentA: "Classical", intensity: "HARDCORE" },
  {
    kind: "genre",
    n: "Ballet",
    parentA: "Classical",
    intensity: "EXPERIMENTAL",
  },
  { kind: "genre", n: "Waltz", parentA: "Classical", intensity: "SOFT" },
  { kind: "genre", n: "March", parentA: "Classical", intensity: "SOFT" },
  { kind: "genre", n: "Serenade", parentA: "Classical", intensity: "SOFT" },
  {
    kind: "genre",
    n: "Ragtime",
    parentA: "Vintage",
    intensity: "SOFT",
    influence: { genre: "Classical", intensity: "SOFT" },
  },
  { kind: "genre", n: "Folk Ballad", parentA: "Vintage", intensity: "SOFT" },
  {
    kind: "genre",
    n: "Sacred Choral",
    parentA: "Classical",
    intensity: "SOFT",
  },
  {
    kind: "genre",
    n: "Symphonic Showpiece",
    parentA: "Classical",
    intensity: "EXPERIMENTAL",
  },
  { kind: "genre", n: "Doo-wop", parentA: "Vintage", intensity: "POP" },
  { kind: "genre", n: "Traditional Pop", parentA: "Vintage", intensity: "POP" },
  {
    kind: "genre",
    n: "Choral",
    parentA: "Vintage",
    intensity: "POP",
    influence: { genre: "Classical", intensity: "SOFT" },
  },
];
