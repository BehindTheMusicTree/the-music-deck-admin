import CatalogCard from "@/components/catalog/CatalogCard";
import {
  type CatalogEntry,
  deriveSongsInFromSongIndex,
  formatCatalogIntensity,
} from "@/lib/cards";
import type { CardSongIndex } from "@/lib/cards/song-graph";
import {
  artworkBasename,
  artworkPromptPreview,
  cardArtworkSrc,
  effectiveArtworkPrompt,
  formatArtworkCreatedAtDisplay,
} from "./catalog-table-utils";

interface Props {
  entry: CatalogEntry;
  catalogEntryById: Map<number, CatalogEntry>;
  cardSongIndex: CardSongIndex;
  onSelect: (entry: CatalogEntry) => void;
  onOpenArtworkPrompt: (text: string) => void;
}

export default function CatalogTableRow({
  entry,
  catalogEntryById,
  cardSongIndex,
  onSelect,
  onOpenArtworkPrompt,
}: Props) {
  const {
    rowKey,
    kind,
    card,
    theme,
    catalogNumber,
    catalogSeriesType,
    catalogSeriesLabel,
    catalogGenreLabel,
    catalogIntensity,
    catalogEra,
  } = entry;
  const artworkSrc = cardArtworkSrc(card);

  const songsInIds = deriveSongsInFromSongIndex(cardSongIndex, card.id);
  const songsOutIds = cardSongIndex[card.id]?.songsOut;

  return (
    <tr
      key={rowKey}
      className="border-b border-ui-border/60 last:border-0 align-top cursor-pointer hover:bg-white/[0.03] transition-colors"
      tabIndex={0}
      role="button"
      aria-label={`Open catalogue details for ${card.title}`}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entry);
        }
      }}
    >
      <td className="py-2 pl-2 pr-1">
        {artworkSrc ? (
          <div
            className="mx-auto flex justify-center"
            style={{ width: 102, height: 150, overflow: "hidden" }}
          >
            <div
              style={{ transform: "scale(0.58)", transformOrigin: "top center" }}
            >
              <CatalogCard
                card={card}
                theme={theme}
                small
                enableZoom={false}
                cardSongIndex={cardSongIndex}
              />
            </div>
          </div>
        ) : (
          <div
            className="mx-auto flex justify-center items-center rounded border border-dashed border-ui-border/80 bg-[#12121a]/60 text-center px-1"
            style={{ width: 102, height: 150 }}
          >
            <span className="font-garamond text-[11px] leading-snug text-muted">
              No artwork
            </span>
          </div>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted max-w-[120px] align-middle">
        {card.country ?? "—"}
      </td>
      <td className="py-2.5 px-2 text-white/90 align-middle whitespace-nowrap">
        {catalogGenreLabel}
      </td>
      <td className="py-2.5 px-2 text-muted max-w-[140px] align-middle">
        {card.genre ?? "—"}
      </td>
      <td className="py-2.5 px-2 text-white/90 align-middle whitespace-nowrap font-mono text-[13px] tracking-wide">
        {catalogEra}
      </td>
      <td className="py-2.5 px-2 font-mono text-gold tabular-nums align-middle">
        {catalogNumber}
      </td>
      <td className="py-2.5 px-2 font-mono text-muted tabular-nums align-middle">
        {card.id}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle">
        <div className="text-white/90">{catalogSeriesLabel}</div>
        <div className="text-[11px] mt-0.5 opacity-80">
          {catalogSeriesType === "country"
            ? "by country / region"
            : "by genre"}
        </div>
      </td>
      <td className="py-2.5 px-2 text-muted whitespace-nowrap align-middle">
        {kind}
      </td>
      <td className="py-2.5 px-2 align-middle">{card.title}</td>
      <td className="py-2.5 px-2 text-muted align-middle">
        {card.artist ?? "—"}
      </td>
      <td className="py-2.5 px-2 align-middle">
        {card.wikipediaUrl && (
          <a
            href={card.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs"
            aria-label="Wikipedia"
          >
            W
          </a>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle min-w-0">
        {!songsInIds || songsInIds.length === 0 ? (
          <span className="text-muted/80">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {songsInIds.map((id) => {
              const target = catalogEntryById.get(id);
              if (!target) {
                return (
                  <span
                    key={id}
                    className="inline-flex h-9 min-w-8 items-center justify-center rounded border border-ui-border/70 bg-[#12121a] px-1 font-mono text-[10px] text-muted"
                  >
                    {id}
                  </span>
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className="flex justify-center rounded border border-ui-border/60 bg-[#12121a]/50 hover:border-gold/40"
                  style={{ width: 102, height: 150, overflow: "hidden" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(target);
                  }}
                  aria-label={`Open catalogue details for ${target.card.title}`}
                >
                  <div
                    style={{
                      transform: "scale(0.58)",
                      transformOrigin: "top center",
                    }}
                  >
                    <CatalogCard
                      card={target.card}
                      theme={target.theme}
                      small
                      enableZoom={false}
                      cardSongIndex={cardSongIndex}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle min-w-0">
        {!songsOutIds || songsOutIds.length === 0 ? (
          <span className="text-muted/80">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {songsOutIds.map((id) => {
              const target = catalogEntryById.get(id);
              if (!target) {
                return (
                  <span
                    key={id}
                    className="inline-flex h-9 min-w-8 items-center justify-center rounded border border-ui-border/70 bg-[#12121a] px-1 font-mono text-[10px] text-muted"
                  >
                    {id}
                  </span>
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className="flex justify-center rounded border border-ui-border/60 bg-[#12121a]/50 hover:border-gold/40"
                  style={{ width: 102, height: 150, overflow: "hidden" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(target);
                  }}
                  aria-label={`Open catalogue details for ${target.card.title}`}
                >
                  <div
                    style={{
                      transform: "scale(0.58)",
                      transformOrigin: "top center",
                    }}
                  >
                    <CatalogCard
                      card={target.card}
                      theme={target.theme}
                      small
                      enableZoom={false}
                      cardSongIndex={cardSongIndex}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle min-w-0">
        {artworkSrc ? (
          <span
            className="font-mono text-[11px] leading-snug break-all text-white/85"
            title={artworkSrc}
          >
            {artworkBasename(artworkSrc)}
          </span>
        ) : (
          <span className="text-muted/80">—</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted tabular-nums align-middle whitespace-nowrap font-mono text-[11px]">
        {card.artworkCreatedAt?.trim() ? (
          <span
            className="text-white/85"
            title={card.artworkCreatedAt.trim()}
          >
            {formatArtworkCreatedAtDisplay(card.artworkCreatedAt.trim())}
          </span>
        ) : (
          <span className="text-muted/80">—</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle min-w-0">
        {effectiveArtworkPrompt(card) ? (
          <button
            type="button"
            className="block w-full max-w-[28ch] text-left font-garamond text-[11px] leading-snug text-white/80 hover:text-gold rounded border border-transparent px-0.5 py-0.5 -mx-0.5 hover:border-ui-border/50 hover:bg-white/3 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onOpenArtworkPrompt(effectiveArtworkPrompt(card));
            }}
            aria-label="Open full artwork prompt"
          >
            {artworkPromptPreview(effectiveArtworkPrompt(card)).preview}
          </button>
        ) : (
          <span className="text-muted/80">—</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-muted tabular-nums align-middle">
        {card.year}
      </td>
      <td className="py-2.5 px-2 text-muted align-middle whitespace-nowrap">
        {formatCatalogIntensity(catalogIntensity)}
      </td>
      <td className="py-2.5 px-2 text-muted tabular-nums align-middle">
        {card.pop}
      </td>
      <td className="py-2.5 px-2 text-muted whitespace-nowrap align-middle">
        {card.rarity}
      </td>
      <td className="py-2.5 pr-3 pl-2 text-muted min-w-0 align-middle">
        {card.ability}
      </td>
    </tr>
  );
}
