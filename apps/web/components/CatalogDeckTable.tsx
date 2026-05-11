"use client";

import { useEffect, useState } from "react";
import WishlistDeckTable from "@/components/catalog/WishlistDeckTable";
import CatalogSourceTabs from "@/components/catalog/CatalogSourceTabs";
import CatalogLayoutToolbar from "@/components/catalog/CatalogLayoutToolbar";
import CatalogSeriesSummaryTable from "@/components/catalog/CatalogSeriesSummaryTable";
import {
  CatalogArtworkPromptModal,
  CatalogEntryDetailModal,
} from "@/components/catalog/CatalogModals";
import CatalogTableHeader from "@/components/catalog/CatalogTableHeader";
import CatalogTableRow from "@/components/catalog/CatalogTableRow";
import CatalogGridItem from "@/components/catalog/CatalogGridItem";
import { useCatalogFilters } from "@/components/catalog/useCatalogFilters";
import type { CatalogEntry } from "@/lib/cards";
import type { CardSongIndex } from "@/lib/cards/song-graph";
import type { WishlistEntry } from "@/lib/cards/wishlist";
import { effectiveArtworkPrompt } from "@/components/catalog/catalog-table-utils";

export default function CatalogDeckTable({
  className = "",
  catalogEntries,
  wishlistEntries,
  cardSongIndex,
}: {
  className?: string;
  catalogEntries: CatalogEntry[];
  wishlistEntries: WishlistEntry[];
  cardSongIndex: CardSongIndex;
}) {
  const filters = useCatalogFilters(catalogEntries);
  const [artworkPromptModal, setArtworkPromptModal] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [catalogPanel, setCatalogPanel] = useState<"deck" | "wishlist">("deck");
  const [catalogEntryDetail, setCatalogEntryDetail] =
    useState<CatalogEntry | null>(null);

  useEffect(() => {
    if (artworkPromptModal === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArtworkPromptModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artworkPromptModal]);

  useEffect(() => {
    if (catalogEntryDetail === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatalogEntryDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catalogEntryDetail]);

  return (
    <div className={["w-full min-w-0", className].filter(Boolean).join(" ")}>
      <CatalogSourceTabs
        catalogPanel={catalogPanel}
        onSelectDeck={() => setCatalogPanel("deck")}
        onSelectWishlist={() => {
          setCatalogPanel("wishlist");
          setCatalogEntryDetail(null);
          setArtworkPromptModal(null);
        }}
      />

      {catalogPanel === "wishlist" ? (
        <div
          id="catalog-panel-wishlist"
          role="tabpanel"
          aria-labelledby="catalog-tab-wishlist"
        >
          <WishlistDeckTable
            wishlistEntries={wishlistEntries}
            cardSongIndex={cardSongIndex}
          />
        </div>
      ) : (
        <div
          id="catalog-panel-deck"
          role="tabpanel"
          aria-labelledby="catalog-tab-deck"
        >
          <CatalogSeriesSummaryTable entries={catalogEntries} />

          <CatalogLayoutToolbar
            viewMode={viewMode}
            visibleCount={filters.visibleRows.length}
            onSelectTable={() => {
              setViewMode("table");
              setCatalogEntryDetail(null);
            }}
            onSelectGrid={() => setViewMode("grid")}
          />

          <div className="w-full min-w-0 rounded-[6px] border border-ui-border bg-[#0f0f14]/35 overflow-x-auto">
            <table className="w-full min-w-[1820px] border-collapse text-left">
              <CatalogTableHeader
                sortKey={filters.sortKey}
                sortAsc={filters.sortAsc}
                onActivateSort={filters.onActivateSort}
                onClearFilters={filters.clearAllFilters}
                filterKind={filters.filterKind}
                setFilterKind={filters.setFilterKind}
                filterSeries={filters.filterSeries}
                setFilterSeries={filters.setFilterSeries}
                filterGenre={filters.filterGenre}
                setFilterGenre={filters.setFilterGenre}
                filterLineGenre={filters.filterLineGenre}
                setFilterLineGenre={filters.setFilterLineGenre}
                filterCountry={filters.filterCountry}
                setFilterCountry={filters.setFilterCountry}
                filterRarity={filters.filterRarity}
                setFilterRarity={filters.setFilterRarity}
                filterIntensity={filters.filterIntensity}
                setFilterIntensity={filters.setFilterIntensity}
                filterEra={filters.filterEra}
                setFilterEra={filters.setFilterEra}
                titleQuery={filters.titleQuery}
                setTitleQuery={filters.setTitleQuery}
                artistQuery={filters.artistQuery}
                setArtistQuery={filters.setArtistQuery}
                abilityQuery={filters.abilityQuery}
                setAbilityQuery={filters.setAbilityQuery}
                seriesOptions={filters.seriesOptions}
                eraFilterOptions={filters.eraFilterOptions}
                genreFilterOptions={filters.genreFilterOptions}
                lineGenreFilterOptions={filters.lineGenreFilterOptions}
                countryFilterOptions={filters.countryFilterOptions}
              />
              {viewMode === "table" ? (
                <tbody className="font-garamond text-[15px] text-white/95">
                  {filters.visibleRows.map((entry) => (
                    <CatalogTableRow
                      key={entry.rowKey}
                      entry={entry}
                      catalogEntryById={filters.catalogEntryById}
                      cardSongIndex={cardSongIndex}
                      onSelect={setCatalogEntryDetail}
                      onOpenArtworkPrompt={setArtworkPromptModal}
                    />
                  ))}
                </tbody>
              ) : null}
            </table>
          </div>

          {viewMode === "grid" ? (
            <div className="mt-6 w-full min-w-0 rounded-[6px] border border-ui-border bg-[#0f0f14]/35 p-4 sm:p-6 overflow-x-auto">
              <div className="grid grid-cols-1 min-[900px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 justify-items-center">
                {filters.visibleRows.map((entry) => (
                  <CatalogGridItem
                    key={entry.rowKey}
                    entry={entry}
                    cardSongIndex={cardSongIndex}
                    onSelect={setCatalogEntryDetail}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {filters.visibleRows.length === 0 ? (
            <p className="font-garamond text-muted text-center mt-4 text-sm">
              No cards match the current filters.
            </p>
          ) : null}

          <CatalogEntryDetailModal
            entry={catalogEntryDetail}
            effectiveArtworkPrompt={effectiveArtworkPrompt}
            cardSongIndex={cardSongIndex}
            onClose={() => setCatalogEntryDetail(null)}
            onOpenArtworkPrompt={(text) => {
              setCatalogEntryDetail(null);
              setArtworkPromptModal(text);
            }}
          />

          <CatalogArtworkPromptModal
            text={artworkPromptModal}
            onClose={() => setArtworkPromptModal(null)}
          />
        </div>
      )}
    </div>
  );
}
