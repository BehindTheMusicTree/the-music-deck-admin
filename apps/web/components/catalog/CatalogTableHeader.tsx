import { CARD_RARITY_ORDER, CATALOG_KINDS, formatCatalogIntensity } from "@/lib/cards";
import type { Intensity } from "@/lib/genres/subgenres-data";
import type { SortKey } from "./catalog-table-utils";

const thWrap =
  "align-top font-normal font-cinzel text-[10px] sm:text-[11px] tracking-[0.1em] text-gold/95 py-2 px-2";
const selectBase =
  "w-full max-w-[140px] mt-1 text-[10px] leading-tight bg-[#12121a] border border-ui-border rounded px-1 py-1 text-white/90";
const sortBtnBase =
  "shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] rounded border border-ui-border bg-[#1a1a22] text-[10px] text-muted hover:text-gold hover:border-gold/40 transition-colors";
const sortBtnActive = "border-gold/50 text-gold";

const INTENSITY_VALUES: readonly Intensity[] = [
  "POP",
  "SOFT",
  "EXPERIMENTAL",
  "HARDCORE",
];

function SortToggle({
  label,
  sortKey,
  activeKey,
  asc,
  onActivate,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  asc: boolean;
  onActivate: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <div className="flex items-start justify-between gap-1">
      <span className="leading-snug pt-0.5">{label}</span>
      <button
        type="button"
        className={[sortBtnBase, active ? sortBtnActive : ""].join(" ")}
        aria-label={
          active
            ? `${label}: sorted ${asc ? "ascending" : "descending"}, click to reverse`
            : `Sort by ${label}`
        }
        aria-pressed={active}
        onClick={() => onActivate(sortKey)}
      >
        {active ? (asc ? "▲" : "▼") : "⇅"}
      </button>
    </div>
  );
}

interface Props {
  sortKey: SortKey;
  sortAsc: boolean;
  onActivateSort: (key: SortKey) => void;
  onClearFilters: () => void;
  filterKind: string;
  setFilterKind: (v: string) => void;
  filterSeries: string;
  setFilterSeries: (v: string) => void;
  filterGenre: string;
  setFilterGenre: (v: string) => void;
  filterLineGenre: string;
  setFilterLineGenre: (v: string) => void;
  filterCountry: string;
  setFilterCountry: (v: string) => void;
  filterRarity: string;
  setFilterRarity: (v: string) => void;
  filterIntensity: string;
  setFilterIntensity: (v: string) => void;
  filterEra: string;
  setFilterEra: (v: string) => void;
  titleQuery: string;
  setTitleQuery: (v: string) => void;
  artistQuery: string;
  setArtistQuery: (v: string) => void;
  abilityQuery: string;
  setAbilityQuery: (v: string) => void;
  seriesOptions: { value: string; label: string }[];
  eraFilterOptions: string[];
  genreFilterOptions: string[];
  lineGenreFilterOptions: string[];
  countryFilterOptions: string[];
}

export default function CatalogTableHeader({
  sortKey,
  sortAsc,
  onActivateSort,
  onClearFilters,
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
  seriesOptions,
  eraFilterOptions,
  genreFilterOptions,
  lineGenreFilterOptions,
  countryFilterOptions,
}: Props) {
  return (
    <thead>
      <tr className="border-b border-ui-border">
        <th className={`${thWrap} w-[120px] pl-3`}>
          <div className="flex flex-col gap-1.5">
            <span className="leading-snug">Preview</span>
            <button
              type="button"
              className="text-[9px] font-mono tracking-wide text-muted hover:text-gold underline-offset-2 hover:underline text-left"
              onClick={onClearFilters}
            >
              Reset filters and sort
            </button>
          </div>
        </th>
        <th className={`${thWrap} min-w-[104px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Country / region"
              sortKey="country"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              aria-label="Filter by country or region"
            >
              <option value="all">All countries</option>
              {countryFilterOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "__empty__" ? "— (none)" : c}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[96px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="App genre"
              sortKey="genre"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              aria-label="Filter by app / table genre"
            >
              <option value="all">All app genres</option>
              {genreFilterOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[100px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Genre"
              sortKey="lineGenre"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterLineGenre}
              onChange={(e) => setFilterLineGenre(e.target.value)}
              aria-label="Filter by card genre line (subgenre or app genre)"
            >
              <option value="all">All</option>
              {lineGenreFilterOptions.map((sg) => (
                <option key={sg} value={sg}>
                  {sg === "__empty__" ? "— (none)" : sg}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[88px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Era"
              sortKey="era"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterEra}
              onChange={(e) => setFilterEra(e.target.value)}
              aria-label="Filter by card era (season)"
            >
              <option value="all">All eras</option>
              {eraFilterOptions.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-muted/75 leading-tight mt-0.5">
              Card season
            </span>
          </div>
        </th>
        <th className={`${thWrap} w-[56px]`}>
          <SortToggle
            label="№"
            sortKey="catalogNo"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
        </th>
        <th className={`${thWrap} w-[56px]`}>
          <SortToggle
            label="ID"
            sortKey="id"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
        </th>
        <th className={`${thWrap} min-w-[108px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Series"
              sortKey="series"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterSeries}
              onChange={(e) => setFilterSeries(e.target.value)}
              aria-label="Filter by series"
            >
              <option value="all">All series</option>
              {seriesOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[88px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Type"
              sortKey="kind"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              aria-label="Filter by card type"
            >
              <option value="all">All types</option>
              {CATALOG_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[100px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Title"
              sortKey="title"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <input
              type="search"
              placeholder="Contains…"
              className={`${selectBase} placeholder:text-muted/70`}
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              aria-label="Filter by title"
            />
          </div>
        </th>
        <th className={`${thWrap} min-w-[100px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Artist"
              sortKey="artist"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <input
              type="search"
              placeholder="Contains…"
              className={`${selectBase} placeholder:text-muted/70`}
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              aria-label="Filter artist name"
            />
          </div>
        </th>
        <th className={`${thWrap} w-8`}>
          <span className="leading-snug">Wiki</span>
        </th>
        <th className={`${thWrap} min-w-[92px]`}>
          <span className="leading-snug">Songs in</span>
        </th>
        <th className={`${thWrap} min-w-[92px]`}>
          <span className="leading-snug">Songs out</span>
        </th>
        <th className={`${thWrap} min-w-[132px]`}>
          <SortToggle
            label="Artwork"
            sortKey="artwork"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
          <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
            Bundled file name
          </span>
        </th>
        <th className={`${thWrap} w-[96px]`}>
          <SortToggle
            label="Art created"
            sortKey="artworkCreatedAt"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
          <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
            Local from PNG birth time
          </span>
        </th>
        <th className={`${thWrap} min-w-[200px]`}>
          <SortToggle
            label="Artwork prompt"
            sortKey="artworkPrompt"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
          <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
            First seven words; click for full text
          </span>
        </th>
        <th className={`${thWrap} w-[64px]`}>
          <SortToggle
            label="Year"
            sortKey="year"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
        </th>
        <th className={`${thWrap} min-w-[96px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Intensity"
              sortKey="intensity"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterIntensity}
              onChange={(e) => setFilterIntensity(e.target.value)}
              aria-label="Filter by intensity"
            >
              <option value="all">All levels</option>
              {INTENSITY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {formatCatalogIntensity(v)}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} w-[56px]`}>
          <SortToggle
            label="Pop"
            sortKey="pop"
            activeKey={sortKey}
            asc={sortAsc}
            onActivate={onActivateSort}
          />
        </th>
        <th className={`${thWrap} min-w-[88px]`}>
          <div className="flex flex-col gap-1">
            <SortToggle
              label="Rarity"
              sortKey="rarity"
              activeKey={sortKey}
              asc={sortAsc}
              onActivate={onActivateSort}
            />
            <select
              className={selectBase}
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              aria-label="Filter by rarity"
            >
              <option value="all">All rarities</option>
              {CARD_RARITY_ORDER.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </th>
        <th className={`${thWrap} min-w-[120px] pr-3`}>
          <div className="flex flex-col gap-1">
            <span className="leading-snug">Ability</span>
            <input
              type="search"
              placeholder="Contains…"
              className={`${selectBase} max-w-none`}
              value={abilityQuery}
              onChange={(e) => setAbilityQuery(e.target.value)}
              aria-label="Filter ability name or description"
            />
          </div>
        </th>
      </tr>
    </thead>
  );
}
