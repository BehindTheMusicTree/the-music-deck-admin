/** Six canonical dimensions per battle music element (genre-intensity or country layer). */
export type BattleMusicSixLines = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
];

export type BattleMusicPromptBlock = {
  title: string;
  lines: BattleMusicSixLines;
};

/** Selectable element shapes used by the generator and library (minimal fields). */
export type BattleMusicSelectable =
  | { kind: "genreIntensity"; genre: string; intensity: string }
  | { kind: "country"; country: string };

// ---------------------------------------------------------------------------
// Authored genre · intensity prompts (add rows here as they are validated)
// ---------------------------------------------------------------------------

export const DISCO_FUNK_POP_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Modern Pop Funk blending contemporary pop with classic funk and dance influences. Focus on infectious grooves, tight rhythm sections, and party-ready energy.",
  "Tempo + groove: 115 BPM, bouncy and syncopated. Groove: punchy 4/4 with strong backbeat, syncopated guitar and bass, crisp claps, and percussive breaks. Feels playful, confident, and made for dancing.",
  "Instruments + textures: Clean electric guitars with wah or muted funk riffs, slap or syncopated bass, bright brass stabs, glossy synths, punchy drums, and energetic vocal shouts or crowd responses. Polished, modern production with retro funk flavor.",
  "Mood: Fun, bold, and charismatic. A sense of celebration, swagger, and communal joy. Never dark or aggressive—always upbeat and inclusive.",
  "Structure + dynamics: Immediate groove intro, verse-chorus alternation with dynamic drops, breakdowns, and instrumental hooks. Big, loop-friendly chorus or outro with layered vocals and instrumental hits.",
  "Non-copyright references: General language of 2010s/2020s pop-funk and dance-funk revival. No direct references to specific songs or artists. Captures the vibe of a modern, high-energy party anthem.",
];

export const DISCO_FUNK_SOFT_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Instrumental-leaning Disco with touches of nu-disco, funk-infused dance rock, and retro club energy. Focus on groove, rhythmic layering, and warm analog dance textures.",
  "Tempo + groove: 120 BPM, classic disco tempo. Groove: four-on-the-floor kick, syncopated hi-hats, funky off-beat bass, and percussive guitar. Feels smooth, energetic, and irresistibly danceable.",
  "Instruments + textures: Clean rhythm guitars with wah or muted strums, melodic and funky bass, shimmering strings or synths, brass stabs, electric piano, and layered percussion (congas, claps, shakers). Minimal or wordless vocal hooks only; no verses or sung lyrics.",
  "Mood: Joyful, glamorous, and communal. A sense of celebration, nightlife, and vintage club fun. Never dark or aggressive—always uplifting and inclusive.",
  "Structure + dynamics: Immediate groove intro, instrumental verse-chorus alternation, breakdowns with filtered or soloed elements, and a loop-friendly, energetic outro. Dynamic lifts for chorus and breakdowns.",
  "Non-copyright references: General language of 70s/80s disco, nu-disco, and dancefloor instrumentals. No imitation of specific songs or artists. Captures the vibe of a classic, mostly-instrumental disco set.",
];

export const DISCO_FUNK_EXPERIMENTAL_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Left-field Experimental Funk with touches of nu-funk, art-funk, and avant-groove. Focus on unusual rhythmic ideas, textural play, and off-kilter funk energy rather than traditional funk smoothness.",
  "Tempo + groove: 118 BPM, elastic and syncopated. Groove: broken funk pulse, shifting accents, micro-syncopations, and occasional metric slips. Feels playful, unpredictable, and rhythm-first.",
  "Instruments + textures: Clavinet-style stabs and filtered wah guitars with irregular phrasing; rubbery basslines with slides, ghost notes, and envelope-filter accents; dry, punchy drums (tight snare, crisp hats, quirky percussive layers); analog synth squiggles, modulated leads, glitchy FX bursts; sparse vocal fragments: soft, rhythmic 'Hardcore…', playful, syncopated 'Rock…' (treated as percussive samples, not singing); tape-style saturation, chopped transitions, and experimental noise tails.",
  "Mood: Groovy, eccentric, and curiously funky. A sense of controlled weirdness, creative tension, and off-beat swagger. The vocal drops feel quirky, textural, and part of the rhythm, not emotional or lyrical.",
  "Structure + dynamics: Fragmented intro (isolated bass or clavinet motif with glitchy FX); progressive groove build (layers enter in unexpected patterns); impact section (dense rhythmic interplay, occasional vocal fragments: 'Hardcore… Rock…'); unstable plateau (shifting syncopations, experimental synth gestures); clean loop-safe ending (clipped hit or filtered fade).",
  "Non-copyright references: General language of art-funk, experimental groove music, nu-funk, and post-2000s left-field funk. No imitation of specific artists or riffs. Captures a club-experimental vibe, funky but strange, rhythmic but unpredictable.",
];

export const ROCK_POP_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Pop Rock with influences from 80s/90s radio rock and modern chart-friendly pop. Emphasis on catchy hooks, upbeat energy, and accessible arrangements.",
  "Tempo + groove: 120 BPM, lively and steady. Groove: bright 4/4 with a strong backbeat, syncopated guitar or keyboard accents, and occasional handclaps or tambourine. Feels energetic, fun, and danceable.",
  "Instruments + textures: Clean or lightly overdriven electric guitars, acoustic strums, punchy bass, crisp drums, bright synths or piano, and layered backing vocals. Polished production, with occasional breaks for dynamic contrast.",
  "Mood: Uplifting, confident, and approachable. A sense of youthful optimism, playful attitude, and crowd-pleasing fun. Never too heavy or dark.",
  "Structure + dynamics: Immediate, hooky intro, verse-chorus alternation, energetic bridge, and a big, loop-friendly chorus or outro. Clear dynamic lifts for chorus and bridge.",
  "Non-copyright references: General language of mainstream pop rock, power pop, and radio-friendly rock. No imitation of specific artists or lyrics. Captures the vibe of a festival-ready, all-ages set.",
];

export const ROCK_SOFT_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Soft Rock with influences from 70s/80s adult contemporary and modern mellow pop-rock. Emphasis on melodic clarity, smooth textures, and approachable songwriting.",
  "Tempo + groove: 92 BPM, relaxed and steady. Groove: gentle 4/4 with light syncopation, subtle backbeat, and occasional brushed or rimshot snare. Feels laid-back, warm, and inviting.",
  "Instruments + textures: Clean electric and acoustic guitars with chorus or light reverb, mellow electric piano or synth pads, rounded bass, soft acoustic drums, and tasteful percussion. Optional gentle vocal harmonies or wordless oohs/ahs. Minimal distortion, no aggressive elements.",
  "Mood: Comforting, nostalgic, and emotionally open. A sense of easy confidence, heartfelt sincerity, and relaxed optimism. Never tense or dark.",
  "Structure + dynamics: Simple intro, verse-like build with melodic guitar or keys, soft chorus/plateau, and a gentle, loop-friendly outro. Dynamics remain controlled and never harsh.",
  "Non-copyright references: General language of classic soft rock, adult contemporary, and mellow pop-rock. No imitation of specific artists or lyrics. Captures the vibe of a cozy, radio-friendly set.",
];

export const ROCK_EXPERIMENTAL_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: experimental alternative rock with art-rock edges (2000s/2010s underground spirit).",
  "Tempo + groove: 124 BPM, tight binary pulse with unstable syncopated accents and occasional metric tension.",
  "Instruments + textures: fuzz electric guitars, gritty bass, punchy acoustic drums, saturated analogue synth layers, noisy transitions, fragmented FX tails.",
  "Mood: dark, introspective, and volatile, with controlled chaos and nervous forward motion.",
  "Structure + dynamics: sparse intro -> progressive tension build -> disruptive impact section -> unstable plateau -> sharp but loop-safe release.",
  "Non-copyright references: post-2000s alternative/art-rock scene language, experimental indie club energy, no direct song or artist imitation.",
];

export const ROCK_HARDCORE_PROMPT_LINES: BattleMusicSixLines = [
  "Genre + sub-genre: Straight Hard Rock with touches of garage rock and post‑2000s alternative rock. Focus on riff energy, tight grooves, and amplified attitude, without drifting into metal or extreme heaviness.",
  "Tempo + groove: 142 BPM, steady and muscular. Groove: driving 4/4, mid‑tempo push, syncopated guitar stabs, and occasional half‑time drops for emphasis. Feels energetic, confident, and stage‑ready.",
  "Instruments + textures: Crunchy electric guitars with classic hard‑rock distortion, palm‑muted accents, and open‑chord bursts. Warm, gritty bass glued to the kick drum. Punchy acoustic drums: big snare, roomy toms, bright cymbals. Sparse vocal shouts: Occasional callouts like “Hardcore!” or “Rock!” used as percussive hits, not melodic lines. No verses, no sung lyrics. Light amp noise, pick scrapes, and feedback tails for transitions.",
  "Mood: Bold, energetic, and attitude‑forward. A sense of raw confidence, sweaty rehearsal‑room power, and unpolished authenticity. Not violent — just loud, gritty, and proudly rock‑centric.",
  "Structure + dynamics: Riff‑first intro, immediate and catchy. Groove‑driven build, guitars locking with drums. Impact section with a heavier riff and a few shouted cues (“Hardcore!”, “Rock!”). Plateau with alternating tight riffs and open‑chord hits. Clean, loop‑friendly ending, either a final unison hit or a short feedback fade.",
  "Non-copyright references: General language of 2000s/2010s hard rock revival, garage‑rock energy, and alt‑rock grit. No imitation of specific bands or vocal melodies. Captures the vibe of a small club hard‑rock set.",
];

const GENRE_INTENSITY_REGISTRY: Record<string, BattleMusicSixLines> = {
  "Disco/Funk|pop": DISCO_FUNK_POP_PROMPT_LINES,
  "Disco/Funk|soft": DISCO_FUNK_SOFT_PROMPT_LINES,
  "Disco/Funk|experimental": DISCO_FUNK_EXPERIMENTAL_PROMPT_LINES,
  "Rock|experimental": ROCK_EXPERIMENTAL_PROMPT_LINES,
  "Rock|hardcore": ROCK_HARDCORE_PROMPT_LINES,
  "Rock|soft": ROCK_SOFT_PROMPT_LINES,
  "Rock|pop": ROCK_POP_PROMPT_LINES,
};

export const ROCK_EXPERIMENTAL_PROMPT_TEXT =
  ROCK_EXPERIMENTAL_PROMPT_LINES.join("\n");

/** Plain text for library rows — empty until authored in this file. */
export function genreIntensityPromptTextOrEmpty(
  genre: string,
  intensity: string,
): string {
  const lines = GENRE_INTENSITY_REGISTRY[`${genre}|${intensity}`];
  return lines ? [...lines].join("\n") : "";
}

function fallbackGenreIntensityBlock(
  genre: string,
  intensity: string,
): BattleMusicPromptBlock {
  const lines: BattleMusicSixLines = [
    `Genre + sub-genre: ${genre} / ${intensity} (to be authored).`,
    "Tempo + groove: to be authored.",
    "Instruments + textures: to be authored.",
    "Mood: to be authored.",
    "Structure + dynamics: to be authored.",
    "Non-copyright references: to be authored.",
  ];
  return { title: `${genre} · ${intensity}`, lines };
}

function countryLayerBlock(country: string): BattleMusicPromptBlock {
  const lines: BattleMusicSixLines = [
    `Genre + sub-genre: battle-ready hybrid layer inspired by ${country} regional identity.`,
    "Tempo + groove: inherit tempo from pair context; lock to competitive, readable rhythmic grid.",
    `Instruments + textures: regional tonal cues inspired by ${country}, modernised for game mix clarity.`,
    "Mood: identity-forward, cinematic, and cohesive with battle intensity.",
    "Structure + dynamics: supportive phrasing blocks that can blend and loop cleanly in crossfades.",
    "Non-copyright references: regional scene/era colour only, no direct melody quotation or artist imitation.",
  ];
  return { title: `${country} · country layer`, lines };
}

export function battleMusicElementPromptBlock(
  sel: BattleMusicSelectable,
): BattleMusicPromptBlock {
  if (sel.kind === "country") {
    return countryLayerBlock(sel.country);
  }
  const authored = GENRE_INTENSITY_REGISTRY[`${sel.genre}|${sel.intensity}`];
  if (authored) {
    return { title: `${sel.genre} · ${sel.intensity}`, lines: authored };
  }
  return fallbackGenreIntensityBlock(sel.genre, String(sel.intensity));
}
