import { useMemo, useState } from "react";
import type { CatalogEntry } from "@/lib/cards";
import { compareRows, type SortKey } from "./catalog-table-utils";

export function useCatalogFilters(catalogEntries: CatalogEntry[]) {
  const [filterKind, setFilterKind] = useState("all");
  const [filterSeries, setFilterSeries] = useState("all");
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterLineGenre, setFilterLineGenre] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterIntensity, setFilterIntensity] = useState("all");
  const [filterEra, setFilterEra] = useState("all");
  const [titleQuery, setTitleQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [abilityQuery, setAbilityQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);

  const seriesOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of catalogEntries) {
      const value = `${e.catalogSeriesType}\t${e.catalogSeriesLabel}`;
      const label =
        e.catalogSeriesType === "country"
          ? `${e.catalogSeriesLabel} (country / region)`
          : `${e.catalogSeriesLabel} (genre)`;
      seen.set(value, label);
    }
    return [...seen.entries()]
      .sort(([, la], [, lb]) =>
        la.localeCompare(lb, undefined, { sensitivity: "base" }),
      )
      .map(([value, label]) => ({ value, label }));
  }, [catalogEntries]);

  const eraFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) s.add(e.catalogEra);
    return [...s].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [catalogEntries]);

  const genreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) s.add(e.catalogGenreLabel);
    return [...s].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [catalogEntries]);

  const lineGenreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) {
      s.add(e.card.genre ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return -1;
      if (b === "__empty__") return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [catalogEntries]);

  const countryFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) {
      s.add(e.card.country ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return 1;
      if (b === "__empty__") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [catalogEntries]);

  const visibleRows = useMemo(() => {
    let rows = catalogEntries;
    if (filterKind !== "all") rows = rows.filter((r) => r.kind === filterKind);
    if (filterSeries !== "all") {
      const [t, lab] = filterSeries.split("\t");
      rows = rows.filter(
        (r) => r.catalogSeriesType === t && r.catalogSeriesLabel === lab,
      );
    }
    if (filterGenre !== "all") {
      rows = rows.filter((r) => r.catalogGenreLabel === filterGenre);
    }
    if (filterLineGenre !== "all") {
      rows = rows.filter((r) =>
        filterLineGenre === "__empty__"
          ? !r.card.genre
          : r.card.genre === filterLineGenre,
      );
    }
    if (filterCountry !== "all") {
      rows = rows.filter((r) =>
        filterCountry === "__empty__"
          ? !r.card.country
          : r.card.country === filterCountry,
      );
    }
    if (filterRarity !== "all") {
      rows = rows.filter((r) => r.card.rarity === filterRarity);
    }
    if (filterIntensity !== "all") {
      rows = rows.filter((r) => r.catalogIntensity === filterIntensity);
    }
    if (filterEra !== "all") {
      rows = rows.filter((r) => r.catalogEra === filterEra);
    }
    const tq = titleQuery.trim().toLowerCase();
    if (tq) {
      rows = rows.filter((r) => r.card.title.toLowerCase().includes(tq));
    }
    const aq = artistQuery.trim().toLowerCase();
    if (aq) {
      rows = rows.filter((r) =>
        (r.card.artist ?? "").toLowerCase().includes(aq),
      );
    }
    const ab = abilityQuery.trim().toLowerCase();
    if (ab) {
      rows = rows.filter(
        (r) =>
          r.card.ability.toLowerCase().includes(ab) ||
          r.card.abilityDesc.toLowerCase().includes(ab),
      );
    }
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortAsc));
  }, [
    filterKind,
    filterSeries,
    filterGenre,
    filterLineGenre,
    filterCountry,
    filterRarity,
    filterIntensity,
    filterEra,
    titleQuery,
    artistQuery,
    abilityQuery,
    catalogEntries,
    sortKey,
    sortAsc,
  ]);

  const catalogEntryById = useMemo(() => {
    const byId = new Map<number, CatalogEntry>();
    for (const e of catalogEntries) byId.set(e.card.id, e);
    return byId;
  }, [catalogEntries]);

  const clearAllFilters = () => {
    setFilterKind("all");
    setFilterSeries("all");
    setFilterGenre("all");
    setFilterLineGenre("all");
    setFilterCountry("all");
    setFilterRarity("all");
    setFilterIntensity("all");
    setFilterEra("all");
    setTitleQuery("");
    setArtistQuery("");
    setAbilityQuery("");
    setSortKey("id");
    setSortAsc(true);
  };

  const onActivateSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return {
    filterKind,
    setFilterKind,
    filterSeries,
    setFilterSeries,
    filterGenre,
    setFilterGenre,
    filterLineGenre,
    setFilterLineGenre,
    filterCountry,
    setFilterCountry,
    filterRarity,
    setFilterRarity,
    filterIntensity,
    setFilterIntensity,
    filterEra,
    setFilterEra,
    titleQuery,
    setTitleQuery,
    artistQuery,
    setArtistQuery,
    abilityQuery,
    setAbilityQuery,
    sortKey,
    sortAsc,
    onActivateSort,
    clearAllFilters,
    seriesOptions,
    eraFilterOptions,
    genreFilterOptions,
    lineGenreFilterOptions,
    countryFilterOptions,
    visibleRows,
    catalogEntryById,
  };
}
