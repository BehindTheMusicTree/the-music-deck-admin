import Link from "next/link";
import Card, { type CardData } from "@/components/cards/Card";
import {
  type RootGenreName,
  APP_GENRE_THEMES,
  appGenreIntensity,
  genreIntensityIn,
  genreIntensityOut,
  resolveThemeSelection,
  sortGenreIntensityNodesForStripDisplay,
  subgenreIntensity,
  type GenreName,
  themeForCountry as worldThemeForCountry,
} from "@/lib/genres";
import { CARD_RARITY_ORDER } from "@/lib/cards";
import { getCatalogSongIndex, getShippedCatalogCards } from "@/lib/cards-api";
import { apiCardToCardData, type ApiCardJson } from "@/lib/deck-from-api";

function findShippedCard(shipped: ApiCardJson[], id: number): CardData {
  const c = shipped.find((x) => x.id === id);
  if (!c) throw new Error(`Missing shipped card id ${id}`);
  return apiCardToCardData(c);
}

function firstWorldFlagCard(shipped: ApiCardJson[]): CardData {
  const rows = shipped.filter((c) => {
    const country = c.country?.trim();
    const genre = c.genre?.trim();
    if (!country) return false;
    return genre === country;
  });
  if (!rows[0]) {
    // Fallback for older/incomplete data where country root rows are missing.
    rows.push(...shipped.filter((c) => Boolean(c.country?.trim())));
  }
  rows.sort((a, b) => a.id - b.id);
  if (!rows[0]) throw new Error("No world flag cards in catalogue");
  return apiCardToCardData(rows[0]);
}

function assertCardGenre(card: CardData, context: string): string {
  const g = card.genre?.trim();
  if (!g) throw new Error(`${context}: missing genre`);
  return g;
}

function assertCardCountry(card: CardData, context: string): string {
  const c = card.country?.trim();
  if (!c) throw new Error(`${context}: missing country`);
  return c;
}

export async function CardsSongsContent() {
  const shipped = await getShippedCatalogCards();
  const cardSongIndex = await getCatalogSongIndex();
  const genreExample = (id: number) => findShippedCard(shipped, id);
  const anatomyCard = findShippedCard(shipped, 39);
  const takeFiveWorldFlag = findShippedCard(shipped, 76);
  /** Shipped catalogue cards with no `songsOut` and no peers pointing in — strips stay empty. */
  const noCatalogSongTransitionExamples = [
    {
      key: "no-track-rock",
      caption: "Bohemian Rhapsody — no track edges in the catalogue graph.",
      card: genreExample(1),
      theme: APP_GENRE_THEMES.Rock,
    },
    {
      key: "no-track-mainstream",
      caption:
        "Shape of You — same (genre strips still follow transition rules).",
      card: genreExample(49),
      theme: APP_GENRE_THEMES.Mainstream,
    },
    {
      key: "no-track-world",
      caption: "Take Five — world row with empty track transition strips.",
      card: takeFiveWorldFlag,
      theme: worldThemeForCountry("USA"),
    },
  ] as const;

  const greatPretenderWorld = findShippedCard(shipped, 100);
  const pistolsGodSaveTheQueen = genreExample(29);
  const classicalGodSaveTheQueen = genreExample(39);
  const vivaldiSpring = genreExample(54);

  const catalogSongEdgeShapeExamples = [
    {
      key: "track-one-in-no-out",
      caption:
        "One incoming, no outgoing — Sex Pistols’ God Save the Queen only receives the classical anthem link.",
      card: pistolsGodSaveTheQueen,
      theme: resolveThemeSelection({
        genre: assertCardGenre(
          pistolsGodSaveTheQueen,
          "Sex Pistols God Save the Queen",
        ),
      }).theme,
    },
    {
      key: "track-one-out-no-in",
      caption:
        "One outgoing, no incoming — The Great Pretender lists the next row only.",
      card: greatPretenderWorld,
      theme: resolveThemeSelection({
        genre: assertCardGenre(greatPretenderWorld, "The Great Pretender"),
        country: assertCardCountry(greatPretenderWorld, "The Great Pretender"),
      }).theme,
    },
    {
      key: "track-in-and-out",
      caption:
        "Both strips — Vivaldi’s Spring receives Winter (in) and hands off to Summer (out).",
      card: vivaldiSpring,
      theme: resolveThemeSelection({
        genre: assertCardGenre(vivaldiSpring, "Vivaldi Spring"),
      }).theme,
    },
    {
      key: "track-same-neighbour-in-out",
      caption:
        "Same neighbour on In and Out — classical God Save the Queen swaps edges with God Save the King and also links forward to the punk track.",
      card: classicalGodSaveTheQueen,
      theme: resolveThemeSelection({
        genre: assertCardGenre(
          classicalGodSaveTheQueen,
          "Classical God Save the Queen",
        ),
      }).theme,
    },
  ];

  const intensityExamples: Array<{
    level: "POP" | "SOFT" | "EXPERIMENTAL" | "HARDCORE";
    card: CardData;
  }> = [
    {
      level: "POP",
      card: { ...genreExample(2), id: 9701, title: "Intensity Pop" },
    },
    {
      level: "SOFT",
      card: { ...genreExample(1), id: 9702, title: "Intensity Soft" },
    },
    {
      level: "EXPERIMENTAL",
      card: {
        ...genreExample(3),
        id: 9703,
        title: "Intensity Experimental",
      },
    },
    {
      level: "HARDCORE",
      card: { ...genreExample(8), id: 9704, title: "Intensity Hardcore" },
    },
  ];

  const popularityExamples: Array<{ note: number; card: CardData }> =
    Array.from({ length: 9 }, (_, i) => {
      const note = i + 1;
      const pop = note;
      return {
        note,
        card: {
          ...genreExample(1),
          id: 9800 + note,
          title: `Popularity ${note}`,
          pop,
          rarity: note >= 8 ? "LEGENDARY" : note >= 5 ? "CLASSIC" : "BANGER",
        },
      };
    });

  const genreTransitionExamples: Array<{
    key: string;
    label: string;
    card: CardData;
    theme: (typeof APP_GENRE_THEMES)[RootGenreName];
  }> = [
    {
      key: "mainstream-shape-of-you",
      label: "Mainstream — Shape of You (pop hub)",
      card: { ...genreExample(49), genre: "Mainstream" },
      theme: APP_GENRE_THEMES.Mainstream,
    },
    {
      key: "rock-soft",
      label: "Rock (soft)",
      card: genreExample(1),
      theme: APP_GENRE_THEMES.Rock,
    },
    {
      key: "electronic-hardcore",
      label: "Electronic (hardcore)",
      card: genreExample(8),
      theme: APP_GENRE_THEMES.Electronic,
    },
    {
      key: "classical-experimental",
      label: "Classical (experimental)",
      card: genreExample(7),
      theme: APP_GENRE_THEMES.Classical,
    },
  ];
  const genreTransitionExamplesWithLinks = genreTransitionExamples.map(
    (item) => {
      if (item.key === "mainstream-shape-of-you") {
        const node = {
          genre: "Mainstream" as GenreName,
          intensity: "POP" as const,
        };
        return {
          ...item,
          transitionsIn: sortGenreIntensityNodesForStripDisplay(
            genreIntensityIn(node),
          ),
          transitionsOut: sortGenreIntensityNodesForStripDisplay(
            genreIntensityOut(node),
          ),
        };
      }
      const resolved = item.card.genre
        ? resolveThemeSelection({
            genre: item.card.genre,
            country: item.card.country,
          })
        : null;
      const genreName = resolved?.resolvedGenre as GenreName | undefined;
      if (!genreName) return { ...item, transitionsIn: [], transitionsOut: [] };
      const intensity = resolved?.resolvedSubgenre
        ? subgenreIntensity(resolved.resolvedSubgenre)
        : appGenreIntensity(genreName as RootGenreName);
      const node = { genre: genreName, intensity };
      return {
        ...item,
        transitionsIn: sortGenreIntensityNodesForStripDisplay(
          genreIntensityIn(node),
        ),
        transitionsOut: sortGenreIntensityNodesForStripDisplay(
          genreIntensityOut(node),
        ),
      };
    },
  );

  const worldFlagSample = firstWorldFlagCard(shipped);

  const themeRuleExamples: Array<{
    key: string;
    title: string;
    left: string;
    right: string;
    border: string;
    card: CardData;
    theme: (typeof APP_GENRE_THEMES)[RootGenreName];
  }> = [
    {
      key: "genre-subgenre-pop",
      title: "Genre-subgenre (pop intensity)",
      left: "Parent genre (displayed as Pop for Mainstream and pop-intensity).",
      right: "Disco Pop.",
      border:
        "Border uses the subgenre-derived colour theme (no country flag layer).",
      card: genreExample(2),
      theme: APP_GENRE_THEMES.Mainstream,
    },
    {
      key: "genre-subgenre-non-pop",
      title: "Genre-subgenre (non-pop intensity)",
      left: "Parent genre.",
      right: "House.",
      border:
        "Border uses the subgenre-derived colour theme (no country flag layer).",
      card: genreExample(3),
      theme: APP_GENRE_THEMES.Electronic,
    },
    {
      key: "country-subgenre",
      title: "Country-subgenre",
      left: "Country/region.",
      right: "Country-subgenre.",
      border:
        "Border and full theme always come from the country/region theme.",
      card: worldFlagSample,
      theme: worldThemeForCountry(worldFlagSample.country!),
    },
    {
      key: "region-subgenre",
      title: "Country/region (region example)",
      left: "Country/region.",
      right: "Country-subgenre.",
      border:
        "Border and full theme always come from the region theme (same rule as country-subgenre).",
      card: findShippedCard(shipped, 77),
      theme: worldThemeForCountry("Bretagne"),
    },
    {
      key: "country-plus-genre",
      title: "Country/region + genre",
      left: "Country/region.",
      right: "Genre.",
      border: "Border fades from country flag (left) to genre colour (right).",
      card: findShippedCard(shipped, 9101),
      theme: worldThemeForCountry("Spain"),
    },
    {
      key: "country-plus-genre-subgenre",
      title: "Country/region + genre-subgenre",
      left: "Country/region.",
      right: "Genre-subgenre.",
      border:
        "Border fades from country flag (left) to subgenre/genre colour (right).",
      card: findShippedCard(shipped, 27),
      theme: worldThemeForCountry("France"),
    },
    {
      key: "bleed",
      title: "Bleed mode",
      left: "Country/region.",
      right: "Country-subgenre.",
      border:
        "No border — artwork fills the card edge-to-edge. UI bands (Genre strip, ability, stats, footer) stay inset as in normal mode.",
      card: findShippedCard(shipped, 26),
      theme: worldThemeForCountry("Bretagne"),
    },
  ];

  return (
    <div className="px-6 py-10 flex flex-col items-center min-h-screen">
      <div className="page-index mb-2">05</div>
      <div className="page-eyebrow mb-4">Card frame anatomy</div>
      <h2 className="font-cinzel text-3xl tracking-[4px] text-white mb-2">
        THE <em className="text-gold not-italic">CARDS</em>
      </h2>
      <p className="font-garamond italic text-muted max-w-[600px] text-center mb-14">
        Each card adapts its colour theme to its genre. The frame anatomy —
        header, artwork, Genre strip, ability box, stats, and footer — remains
        constant across all genres and rarities.
      </p>

      {/* Anatomy legend */}
      <div id="anatomy" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Frame Anatomy</div>
        <div className="flex gap-12 items-start flex-wrap">
          <div
            style={{
              transform: "scale(1.5)",
              transformOrigin: "top left",
              flexShrink: 0,
              width: 408,
              height: 600,
            }}
          >
            <Card
              card={anatomyCard}
              theme={APP_GENRE_THEMES.Electronic}
              cardSongIndex={cardSongIndex}
            />
          </div>
          <div className="flex flex-col gap-3 pt-2 flex-1">
            {[
              [
                "Header",
                "Song title, artist, and popularity score (1–9 stars).",
              ],
              [
                "Song Transitions",
                "Arrow strips showing musical lineage — which track this song leads from (left) and which it leads to (right). Each strip uses the linked track's genre colour.",
              ],
              [
                "Genre Transitions",
                "Small genre icons on coloured strips: valid mix paths under the transition rules — left lists genre and intensity pairs that may lead into this card; right lists pairs this card may transition out to next. Each strip uses that endpoint's colour. These follow the genre transition graph (genre plus intensity at each step), not only moving along one intensity axis.",
              ],
              [
                "Artwork",
                "Full illustration with mood and palette matched to the card's genre.",
              ],
              [
                "Genre strip",
                "Genre and subgenre labels with colour diamonds. The subgenre diamond drives the card's full colour theme.",
              ],
              [
                "Matchup strip",
                "Battle matchups at a glance: weaknesses on the left, advantages on the right.",
              ],
              ["Ability box", "The card's unique ability name and its effect."],
              [
                "Popularity",
                "Award symbols (1–9) representing the song's cultural reach.",
              ],
              [
                "Intensity",
                "Triangular gauge showing where the card falls on the pop-to-hardcore spectrum.",
              ],
              ["Footer", "Release year and rarity symbol."],
              [
                "Border",
                "Coloured in the subgenre's canonical colour. World cards show the country flag. Bleed mode removes the border entirely.",
              ],
            ].map(([name, desc]) => (
              <div key={name} className="flex gap-3">
                <div className="w-[120px] shrink-0 font-cinzel tracking-[1px] text-gold pt-px">
                  {name}
                </div>
                <div className="font-garamond text-muted leading-normal">
                  {desc.split("\n").map((line, idx) => {
                    if (!line.trim()) return <div key={idx} className="h-2" />;
                    const colonIndex = line.indexOf(":");
                    if (colonIndex <= 0) return <div key={idx}>{line}</div>;
                    const label = line.slice(0, colonIndex + 1);
                    const value = line.slice(colonIndex + 1).trimStart();
                    return (
                      <div key={idx}>
                        <span className="text-white">{label}</span> {value}
                      </div>
                    );
                  })}
                  {name === "Artwork" ? (
                    <div>
                      <span className="text-white">Guidelines:</span>{" "}
                      <Link
                        href="/charter/artworks"
                        className="text-gold underline-offset-2 hover:underline"
                      >
                        Charter — Artworks
                      </Link>
                      .
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="theme" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Theme</div>
        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4 flex flex-col gap-4">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themeRuleExamples.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[6px] border border-ui-border bg-[#12121a]/45 p-3 flex gap-3 items-start"
                >
                  <div className="shrink-0">
                    <Card card={item.card} theme={item.theme} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-cinzel text-[15px] tracking-[1px] text-white mb-1">
                      {item.title}
                    </div>
                    <ul className="font-garamond text-muted text-[16px] leading-normal list-none pl-0 flex flex-col gap-0.5">
                      <li>
                        <span className="text-white">
                          Genre strip — primary:
                        </span>{" "}
                        {item.left}
                      </li>
                      <li>
                        <span className="text-white">
                          Genre strip — secondary:
                        </span>{" "}
                        {item.right}
                      </li>
                      <li>
                        <span className="text-white">Frame border:</span>{" "}
                        {item.border}
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label-accent mb-1.5">
              Display conventions
            </div>
            <ul className="font-garamond text-muted leading-[1.6] list-disc pl-5 flex flex-col gap-1">
              <li>
                Mainstream is displayed as Pop; pop-intensity subgenres also
                display Pop on the left label.
              </li>
              <li>Genre and genre-subgenre use colour diamonds.</li>
              <li>
                Country and country-subgenre use country identity: symbol when
                available, otherwise flag diamond.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div id="track-transitions" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Song Transitions</div>
        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4 mb-6">
          <p className="font-garamond text-muted leading-[1.6] mb-3">
            Song transitions are card-to-card links used by the transition
            strips. They are directional and built from each card&apos;s
            outgoing list. If card B appears in A&apos;s outgoing list, then A
            appears in B&apos;s incoming list — the graph is consistent both
            ways. The same pair can link both directions: B may sit on A&apos;s
            out strip and on A&apos;s in strip when each card lists the other in{" "}
            <code>songsOut</code>. A card may have several incoming links,
            several outgoing links, or none on either side — counts are
            independent.
          </p>
          <p className="font-garamond text-muted leading-[1.6] mb-0">
            Cards below are real catalogue rows with{" "}
            <strong className="font-semibold text-foreground/90">
              no track transitions
            </strong>
            : they omit <code>songsOut</code> and nothing else targets them, so
            both strips render empty while genre transitions behave as usual.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {noCatalogSongTransitionExamples.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: 314,
                  height: 440,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "top left",
                  }}
                >
                  <Card
                    card={item.card}
                    theme={item.theme}
                    small
                    cardSongIndex={cardSongIndex}
                  />
                </div>
              </div>
              <div className="font-mono tracking-[1px] text-muted text-center max-w-[320px]">
                {item.caption}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4 mb-6">
          <p className="font-garamond text-muted leading-[1.6] mb-0">
            The shipped catalogue also includes asymmetric wiring: one-way
            stubs, simple chains, and reciprocal pairs where the same row
            appears on both strips because each lists the other in{" "}
            <code>songsOut</code>.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {catalogSongEdgeShapeExamples.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: 314,
                  height: 440,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "top left",
                  }}
                >
                  <Card
                    card={item.card}
                    theme={item.theme}
                    small
                    cardSongIndex={cardSongIndex}
                  />
                </div>
              </div>
              <div className="font-mono tracking-[1px] text-muted text-center max-w-[320px]">
                {item.caption}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="genre-transitions"
        className="w-full max-w-[1800px] mb-14 border border-ui-border rounded-[6px] bg-white/2 overflow-visible px-[18px] py-4"
      >
        <div className="section-title mb-2">Genre Transitions</div>
        <div className="mb-4 max-w-[900px]">
          <p className="font-garamond italic text-muted leading-[1.45] mb-2">
            This section summarises the same transition graph documented in
            Genres: each node is a genre and intensity pair, links are
            directional, and card strips visualise those legal in and out moves.
          </p>
          <ul className="list-disc pl-6 font-garamond italic text-muted leading-[1.45]">
            <li>Mainstream (pop) links to every genre at pop intensity.</li>
            <li>
              Each non-mainstream node links to itself and to adjacent
              intensities.
            </li>
            <li>
              Neighbour genres are reachable at the same intensity and at one
              step lower.
            </li>
            <li>
              Influence bridges from some subgenres add extra bidirectional
              links.
            </li>
            <li>
              Card strips list cross-genre legal moves; same-genre intensity
              progression is always implied even when not listed.
            </li>
          </ul>
          <p className="font-garamond italic text-muted leading-[1.45] mt-3 mb-0">
            Full rule reference:{" "}
            <Link
              href="/genres#genre-transitions"
              className="text-gold underline-offset-2 hover:underline"
            >
              Genres — Transitions
            </Link>
            .
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {genreTransitionExamplesWithLinks.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: 314,
                  height: 440,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "top left",
                  }}
                >
                  <Card card={item.card} theme={item.theme} small />
                </div>
              </div>
              <div className="font-mono tracking-[1px] text-muted text-center">
                {item.label}
              </div>
              <div className="w-full max-w-[306px] rounded-[6px] border border-ui-border bg-[#0f0f14]/35 overflow-hidden">
                <div className="grid grid-cols-2 border-b border-ui-border">
                  <div className="font-mono text-[11px] tracking-[1px] text-gold/90 px-2 py-1.5 border-r border-ui-border">
                    In
                  </div>
                  <div className="font-mono text-[11px] tracking-[1px] text-gold/90 px-2 py-1.5">
                    Out
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-2 py-1.5 border-r border-ui-border">
                    {item.transitionsIn.map((n) => (
                      <div
                        key={`in-${item.key}-${n.genre}-${n.intensity}`}
                        className="font-mono text-[10px] leading-[1.3] text-muted"
                      >
                        {n.genre} ({n.intensity})
                      </div>
                    ))}
                  </div>
                  <div className="px-2 py-1.5">
                    {item.transitionsOut.map((n) => (
                      <div
                        key={`out-${item.key}-${n.genre}-${n.intensity}`}
                        className="font-mono text-[10px] leading-[1.3] text-muted"
                      >
                        {n.genre} ({n.intensity})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="advantage-weakness" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Advantage &amp; Weakness</div>
        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4">
          <p className="font-garamond text-muted leading-[1.6] mb-4">
            In battles, genres form a matchup layer: each archetype is strong
            against one genre and weak against another. Your card&apos;s genre
            (from its subgenre) determines when you gain an edge or take a
            penalty against an opponent&apos;s card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="section-label-accent mb-1.5">Advantage</div>
              <p className="font-garamond text-muted leading-[1.6] m-0">
                When your genre counters the opponent&apos;s genre, battle
                modifiers favour you (see the battle rules for exact values).
              </p>
            </div>
            <div>
              <div className="section-label-accent mb-1.5">Weakness</div>
              <p className="font-garamond text-muted leading-[1.6] m-0">
                When your genre is weak against the opponent&apos;s genre, you
                take the corresponding penalty — plan sideboard and tempo around
                bad matchups.
              </p>
            </div>
          </div>
          <p className="font-garamond text-muted leading-[1.6] mt-4 mb-0">
            Full per-genre columns:{" "}
            <Link
              href="/genres#associations"
              className="text-gold underline-offset-2 hover:underline"
            >
              Genres — Associations
            </Link>{" "}
            (&quot;Advantage vs&quot; and &quot;Weak vs&quot;). Numeric battle
            modifiers:{" "}
            <Link
              href="/battles"
              className="text-gold underline-offset-2 hover:underline"
            >
              Battles
            </Link>
            .
          </p>
        </div>
      </div>

      <div id="popularity" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Popularity</div>
        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4">
          <p className="font-garamond text-muted leading-[1.6] mb-3">
            Popularity is shown as a 1-9 award note instead of a bar. It
            reflects how broadly a track connects with the audience.
          </p>
          <ul className="font-garamond text-muted leading-[1.6] list-disc pl-5 flex flex-col gap-1">
            <li>1-3: gold awards (one to three symbols).</li>
            <li>4-6: platinum awards (one to three symbols).</li>
            <li>7-9: diamond awards (one to three symbols).</li>
            <li>
              Popularity and Intensity are independent stats and can both be
              high.
            </li>
          </ul>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularityExamples.map(({ note, card }) => (
              <div key={note} className="flex flex-col items-center gap-2">
                <div
                  style={{
                    width: 314,
                    height: 440,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      transform: "scale(2)",
                      transformOrigin: "top left",
                    }}
                  >
                    <Card card={card} theme={APP_GENRE_THEMES.Rock} small />
                  </div>
                </div>
                <div className="font-mono tracking-[1px] text-muted">
                  NOTE {note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="intensity" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Intensity</div>
        <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4">
          <p className="font-garamond text-muted leading-[1.6] mb-3">
            Intensity replaces the old experimental gauge with four canonical
            levels. On the card it reads as a right-triangle volume gauge (right
            angle at the bottom-right at 100% width): the empty shape stays
            visible in dull grey; the saturated green→red band fills ¼ to 4/4 of
            its width (pop…hardcore), with a cursor and the matching percentage
            (25%–100%) at the fill edge. The spectrum is always anchored: red is
            fixed at the full 100% width, so lower levels only reveal the left
            (greener) part of that same ramp.
          </p>
          <ul className="font-garamond text-muted leading-[1.6] list-disc pl-5 flex flex-col gap-1">
            <li>Pop (1): low edge, broad accessibility.</li>
            <li>Soft (2): moderate experimentation.</li>
            <li>Experimental (3): strong stylistic risk.</li>
            <li>Hardcore (4): maximal edge and extremity.</li>
          </ul>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {intensityExamples.map(({ level, card }) => (
              <div key={level} className="flex flex-col items-center gap-2">
                <div
                  style={{
                    width: 314,
                    height: 440,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      transform: "scale(2)",
                      transformOrigin: "top left",
                    }}
                  >
                    <Card card={card} theme={APP_GENRE_THEMES.Rock} small />
                  </div>
                </div>
                <div className="font-mono tracking-[1px] text-muted">
                  {level.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rarity variants */}
      <div id="rarities" className="w-full max-w-[1100px] mb-14">
        <div className="section-title mb-5">Rarity Variants</div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CARD_RARITY_ORDER.map((rarity) => (
            <div key={rarity} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: 314,
                  height: 440,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "top left",
                  }}
                >
                  <Card
                    card={{ ...genreExample(1), rarity }}
                    theme={APP_GENRE_THEMES.Rock}
                    small
                  />
                </div>
              </div>
              <div className="font-mono tracking-[1px] text-muted">
                {rarity.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
