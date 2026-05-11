import CatalogCard from "@/components/catalog/CatalogCard";
import type { CatalogEntry } from "@/lib/cards";
import type { CardSongIndex } from "@/lib/cards/song-graph";
import { cardArtworkSrc } from "./catalog-table-utils";

const CATALOG_GRID_THUMB_SCALE = 0.58 * 4;

interface Props {
  entry: CatalogEntry;
  cardSongIndex: CardSongIndex;
  onSelect: (entry: CatalogEntry) => void;
}

export default function CatalogGridItem({ entry, cardSongIndex, onSelect }: Props) {
  const { rowKey, kind, card, theme, catalogNumber, catalogSeriesLabel, catalogGenreLabel } = entry;

  return (
    <button
      key={rowKey}
      type="button"
      className="group flex flex-col items-center gap-2 rounded-lg border border-ui-border bg-[#12121a]/45 p-3 min-w-0 text-left transition-colors hover:border-gold/40 hover:bg-white/4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
      onClick={() => onSelect(entry)}
      aria-label={`Open catalogue details for ${card.title}`}
    >
      <div
        className="mx-auto flex justify-center shrink-0 overflow-hidden"
        style={{ width: 102 * 4, height: 150 * 4 }}
      >
        {cardArtworkSrc(card) ? (
          <div
            style={{
              transform: `scale(${CATALOG_GRID_THUMB_SCALE})`,
              transformOrigin: "top center",
            }}
          >
            <CatalogCard
              card={card}
              theme={theme}
              small
              enableZoom={false}
              cardSongIndex={cardSongIndex}
            />
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded border border-dashed border-ui-border/80 bg-[#12121a]/60 px-1 text-center"
            style={{ width: 102 * 4, height: 150 * 4 }}
          >
            <span className="font-garamond text-[10px] leading-snug text-muted">
              No artwork
            </span>
          </div>
        )}
      </div>
      <div className="w-full min-w-0 text-center">
        <div className="font-garamond text-[13px] text-white/95 leading-snug line-clamp-2 group-hover:text-gold/95 transition-colors">
          {card.title}
        </div>
        <div className="font-garamond text-[11px] text-muted mt-0.5 line-clamp-1">
          {card.artist ?? "—"}
        </div>
        <div className="font-mono text-[10px] text-gold/90 tabular-nums mt-1">
          № {catalogNumber} · {catalogGenreLabel}
        </div>
        <div className="font-mono text-[9px] text-muted/90 mt-0.5 truncate w-full">
          {catalogSeriesLabel}
        </div>
        <div className="font-mono text-[9px] text-muted/70 mt-0.5">{kind}</div>
      </div>
    </button>
  );
}
