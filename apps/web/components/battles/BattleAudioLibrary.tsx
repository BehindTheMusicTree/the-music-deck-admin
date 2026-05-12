"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRY_DATA } from "@/lib/countries";
import { genreIntensityPromptTextOrEmpty } from "@/lib/battle-audio-element-prompts";
import { GENRE_NAMES, type Intensity } from "@/lib/genres";

type SingleKind = "genreIntensity" | "country";
type SortDir = "asc" | "desc";

type SingleRow = {
  key: string;
  kind: SingleKind;
  label: string;
  genre: string;
  intensity: string;
  country: string;
  prompt: string;
  fileSizeMb: number | null;
  durationMin: number | null;
};

type ComboRow = {
  key: string;
  kind: "combo";
  left: string;
  right: string;
  leftType: SingleKind;
  rightType: SingleKind;
  prompt: string;
  fileSizeMb: number | null;
  durationMin: number | null;
};

type AudioMeta = {
  token: string;
  version: number;
  bytes: number;
  durationSec: number | null;
};

const INTENSITIES: Intensity[] = ["POP", "SOFT", "EXPERIMENTAL", "HARDCORE"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tokenForGenreIntensity(genre: string, intensity: string): string {
  return `genre-${slugify(genre)}--intensity-${intensity}`;
}

function tokenForCountry(country: string): string {
  return `country-${slugify(country)}`;
}

function buildSingles(): SingleRow[] {
  const rows: SingleRow[] = [];
  for (const genre of GENRE_NAMES) {
    const levels = genre === "Mainstream" ? (["POP"] as const) : INTENSITIES;
    for (const intensity of levels) {
      rows.push({
        key: tokenForGenreIntensity(genre, intensity),
        kind: "genreIntensity",
        label: `${genre} · ${intensity}`,
        genre,
        intensity,
        country: "",
        prompt: genreIntensityPromptTextOrEmpty(genre, intensity),
        fileSizeMb: null,
        durationMin: null,
      });
    }
  }
  for (const country of Object.keys(COUNTRY_DATA).sort((a, b) =>
    a.localeCompare(b),
  )) {
    rows.push({
      key: tokenForCountry(country),
      kind: "country",
      label: `${country} (country)`,
      genre: "",
      intensity: "",
      country,
      prompt: "",
      fileSizeMb: null,
      durationMin: null,
    });
  }
  return rows;
}

function buildCombinations(singles: SingleRow[]): ComboRow[] {
  const out: ComboRow[] = [];
  for (let i = 0; i < singles.length; i += 1) {
    for (let j = i + 1; j < singles.length; j += 1) {
      const a = singles[i];
      const b = singles[j];
      const [left, right] = [a, b].sort((x, y) => x.key.localeCompare(y.key));
      out.push({
        key: `${left.key}__${right.key}`,
        kind: "combo",
        left: left.label,
        right: right.label,
        leftType: left.kind,
        rightType: right.kind,
        prompt: `${left.prompt}\n\n${right.prompt}`,
        fileSizeMb: null,
        durationMin: null,
      });
    }
  }
  return out;
}

/** Build a map from token → best metadata (highest version wins). */
function buildMetaMap(audioList: AudioMeta[]): Map<string, { bytes: number; durationSec: number | null }> {
  const map = new Map<string, { bytes: number; durationSec: number | null; version: number }>();
  for (const a of audioList) {
    const existing = map.get(a.token);
    if (!existing || a.version > existing.version) {
      map.set(a.token, { bytes: a.bytes, durationSec: a.durationSec, version: a.version });
    }
  }
  return map;
}

export default function BattleAudioLibrary() {
  const baseSingles = useMemo(() => buildSingles(), []);
  const [audioMeta, setAudioMeta] = useState<AudioMeta[]>([]);

  useEffect(() => {
    fetch("/api/battle-audio")
      .then((r) => r.json() as Promise<AudioMeta[]>)
      .then(setAudioMeta)
      .catch(() => {/* silently ignore — metadata stays null */});
  }, []);

  const metaMap = useMemo(() => buildMetaMap(audioMeta), [audioMeta]);

  const singles = useMemo<SingleRow[]>(() =>
    baseSingles.map((row) => {
      const meta = metaMap.get(row.key);
      if (!meta) return row;
      return {
        ...row,
        fileSizeMb: meta.bytes / (1024 * 1024),
        durationMin: meta.durationSec != null ? meta.durationSec / 60 : null,
      };
    }),
    [baseSingles, metaMap],
  );

  const combos = useMemo(() => buildCombinations(singles), [singles]);

  const [singleSortBy, setSingleSortBy] = useState<keyof SingleRow>("key");
  const [singleSortDir, setSingleSortDir] = useState<SortDir>("asc");
  const [singleFilters, setSingleFilters] = useState({
    key: "",
    kind: "",
    label: "",
    genre: "",
    intensity: "",
    country: "",
    prompt: "",
    fileSizeMb: "",
    durationMin: "",
  });

  const [comboSortBy, setComboSortBy] = useState<keyof ComboRow>("key");
  const [comboSortDir, setComboSortDir] = useState<SortDir>("asc");
  const [comboFilters, setComboFilters] = useState({
    key: "",
    left: "",
    right: "",
    leftType: "",
    rightType: "",
    prompt: "",
    fileSizeMb: "",
    durationMin: "",
  });

  const filteredSingles = useMemo(() => {
    const filtered = singles.filter((r) => {
      return (
        r.key.toLowerCase().includes(singleFilters.key.toLowerCase()) &&
        r.kind.toLowerCase().includes(singleFilters.kind.toLowerCase()) &&
        r.label.toLowerCase().includes(singleFilters.label.toLowerCase()) &&
        r.genre.toLowerCase().includes(singleFilters.genre.toLowerCase()) &&
        r.intensity
          .toLowerCase()
          .includes(singleFilters.intensity.toLowerCase()) &&
        r.country.toLowerCase().includes(singleFilters.country.toLowerCase()) &&
        r.prompt.toLowerCase().includes(singleFilters.prompt.toLowerCase()) &&
        String(r.fileSizeMb ?? "").includes(singleFilters.fileSizeMb) &&
        String(r.durationMin ?? "").includes(singleFilters.durationMin)
      );
    });
    return filtered.sort((a, b) => {
      const av = String(a[singleSortBy] ?? "");
      const bv = String(b[singleSortBy] ?? "");
      const base = av.localeCompare(bv);
      return singleSortDir === "asc" ? base : -base;
    });
  }, [singles, singleFilters, singleSortBy, singleSortDir]);

  const filteredCombos = useMemo(() => {
    const filtered = combos.filter((r) => {
      return (
        r.key.toLowerCase().includes(comboFilters.key.toLowerCase()) &&
        r.left.toLowerCase().includes(comboFilters.left.toLowerCase()) &&
        r.right.toLowerCase().includes(comboFilters.right.toLowerCase()) &&
        r.leftType
          .toLowerCase()
          .includes(comboFilters.leftType.toLowerCase()) &&
        r.rightType
          .toLowerCase()
          .includes(comboFilters.rightType.toLowerCase()) &&
        r.prompt.toLowerCase().includes(comboFilters.prompt.toLowerCase()) &&
        String(r.fileSizeMb ?? "").includes(comboFilters.fileSizeMb) &&
        String(r.durationMin ?? "").includes(comboFilters.durationMin)
      );
    });
    return filtered.sort((a, b) => {
      const av = String(a[comboSortBy] ?? "");
      const bv = String(b[comboSortBy] ?? "");
      const base = av.localeCompare(bv);
      return comboSortDir === "asc" ? base : -base;
    });
  }, [combos, comboFilters, comboSortBy, comboSortDir]);

  const toggleSingleSort = (field: keyof SingleRow) => {
    if (singleSortBy === field)
      setSingleSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSingleSortBy(field);
      setSingleSortDir("asc");
    }
  };

  const toggleComboSort = (field: keyof ComboRow) => {
    if (comboSortBy === field)
      setComboSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setComboSortBy(field);
      setComboSortDir("asc");
    }
  };

  const singlesTotalMb = useMemo(
    () =>
      filteredSingles.reduce(
        (sum, row) =>
          sum + (typeof row.fileSizeMb === "number" ? row.fileSizeMb : 0),
        0,
      ),
    [filteredSingles],
  );
  const singlesTotalMin = useMemo(
    () =>
      filteredSingles.reduce(
        (sum, row) =>
          sum + (typeof row.durationMin === "number" ? row.durationMin : 0),
        0,
      ),
    [filteredSingles],
  );
  const combosTotalMb = useMemo(
    () =>
      filteredCombos.reduce(
        (sum, row) =>
          sum + (typeof row.fileSizeMb === "number" ? row.fileSizeMb : 0),
        0,
      ),
    [filteredCombos],
  );
  const combosTotalMin = useMemo(
    () =>
      filteredCombos.reduce(
        (sum, row) =>
          sum + (typeof row.durationMin === "number" ? row.durationMin : 0),
        0,
      ),
    [filteredCombos],
  );

  const totalNeededSongs = singles.length + combos.length;
  const singlesKnownSizeCount = filteredSingles.filter(
    (r) => r.fileSizeMb != null,
  ).length;
  const singlesKnownDurationCount = filteredSingles.filter(
    (r) => r.durationMin != null,
  ).length;
  const combosKnownSizeCount = filteredCombos.filter(
    (r) => r.fileSizeMb != null,
  ).length;
  const combosKnownDurationCount = filteredCombos.filter(
    (r) => r.durationMin != null,
  ).length;
  const totalKnownSizeCount = singlesKnownSizeCount + combosKnownSizeCount;
  const totalKnownDurationCount =
    singlesKnownDurationCount + combosKnownDurationCount;
  const visibleSongs = filteredSingles.length + filteredCombos.length;
  const visibleMb = singlesTotalMb + combosTotalMb;
  const visibleMin = singlesTotalMin + combosTotalMin;

  return (
    <section className="max-w-[1100px]">
      <h2 className="section-title mb-2">Library</h2>
      <p className="font-garamond text-muted mb-6">
        Required battle music inventory with filters and ordering in table
        headers.
      </p>

      <div className="mb-10">
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
          Recap
        </div>
        <div className="overflow-auto rounded border border-ui-border/70 bg-[#12121a]/45">
          <table className="w-full text-left min-w-[720px]">
            <thead className="border-b border-ui-border/70">
              <tr className="font-mono text-[11px] tracking-[0.08em] text-muted">
                <th className="px-3 py-2">scope</th>
                <th className="px-3 py-2">
                  music count (visible / total needed)
                </th>
                <th className="px-3 py-2">total weight (MB)</th>
                <th className="px-3 py-2">total duration (min)</th>
              </tr>
            </thead>
            <tbody className="font-garamond text-sm text-white/90">
              <tr className="border-b border-ui-border/30">
                <td className="px-3 py-2">Singles</td>
                <td className="px-3 py-2">
                  {filteredSingles.length} / {singles.length}
                </td>
                <td className="px-3 py-2">
                  {singlesTotalMb.toFixed(1)} (known {singlesKnownSizeCount}/
                  {filteredSingles.length})
                </td>
                <td className="px-3 py-2">
                  {singlesTotalMin.toFixed(1)} (known{" "}
                  {singlesKnownDurationCount}/{filteredSingles.length})
                </td>
              </tr>
              <tr className="border-b border-ui-border/30">
                <td className="px-3 py-2">2-combinations</td>
                <td className="px-3 py-2">
                  {filteredCombos.length} / {combos.length}
                </td>
                <td className="px-3 py-2">
                  {combosTotalMb.toFixed(1)} (known {combosKnownSizeCount}/
                  {filteredCombos.length})
                </td>
                <td className="px-3 py-2">
                  {combosTotalMin.toFixed(1)} (known {combosKnownDurationCount}/
                  {filteredCombos.length})
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2">
                  {visibleSongs} / {totalNeededSongs}
                </td>
                <td className="px-3 py-2">
                  {visibleMb.toFixed(1)} (known {totalKnownSizeCount}/
                  {visibleSongs})
                </td>
                <td className="px-3 py-2">
                  {visibleMin.toFixed(1)} (known {totalKnownDurationCount}/
                  {visibleSongs})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
          Singles ({filteredSingles.length})
        </div>
        <div className="font-mono text-[11px] tracking-[0.08em] text-muted mb-2">
          Total weight: {singlesTotalMb.toFixed(1)} MB (known{" "}
          {singlesKnownSizeCount}/{filteredSingles.length}) · Total duration:{" "}
          {singlesTotalMin.toFixed(1)} min (known {singlesKnownDurationCount}/
          {filteredSingles.length})
        </div>
        <div className="overflow-auto rounded border border-ui-border/70 bg-[#12121a]/45">
          <table className="w-full text-left min-w-[1280px]">
            <thead className="border-b border-ui-border/70">
              <tr className="font-mono text-[11px] tracking-[0.08em] text-muted">
                {(
                  [
                    "key",
                    "kind",
                    "label",
                    "genre",
                    "intensity",
                    "country",
                    "prompt",
                    "fileSizeMb",
                    "durationMin",
                  ] as const
                ).map((col) => (
                  <th key={col} className="px-3 py-2 align-top">
                    <button
                      type="button"
                      className="hover:text-white"
                      onClick={() => toggleSingleSort(col)}
                    >
                      {col}{" "}
                      {singleSortBy === col
                        ? singleSortDir === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </button>
                    <input
                      value={singleFilters[col]}
                      onChange={(e) =>
                        setSingleFilters((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded border border-ui-border bg-[#0f0f14] px-2 py-1 text-[11px] text-white"
                      placeholder="filter"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSingles.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-ui-border/30 font-garamond text-sm text-white/90"
                >
                  <td className="px-3 py-2 font-mono text-[11px]">{row.key}</td>
                  <td className="px-3 py-2">{row.kind}</td>
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{row.genre}</td>
                  <td className="px-3 py-2">{row.intensity}</td>
                  <td className="px-3 py-2">{row.country}</td>
                  <td className="px-3 py-2">{row.prompt}</td>
                  <td className="px-3 py-2">
                    {row.fileSizeMb != null ? row.fileSizeMb.toFixed(1) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.durationMin != null ? row.durationMin.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
          2-combinations ({filteredCombos.length})
        </div>
        <div className="font-mono text-[11px] tracking-[0.08em] text-muted mb-2">
          Total weight: {combosTotalMb.toFixed(1)} MB (known{" "}
          {combosKnownSizeCount}/{filteredCombos.length}) · Total duration:{" "}
          {combosTotalMin.toFixed(1)} min (known {combosKnownDurationCount}/
          {filteredCombos.length})
        </div>
        <div className="overflow-auto rounded border border-ui-border/70 bg-[#12121a]/45">
          <table className="w-full text-left min-w-[1280px]">
            <thead className="border-b border-ui-border/70">
              <tr className="font-mono text-[11px] tracking-[0.08em] text-muted">
                {(
                  [
                    "key",
                    "left",
                    "right",
                    "leftType",
                    "rightType",
                    "prompt",
                    "fileSizeMb",
                    "durationMin",
                  ] as const
                ).map((col) => (
                  <th key={col} className="px-3 py-2 align-top">
                    <button
                      type="button"
                      className="hover:text-white"
                      onClick={() => toggleComboSort(col)}
                    >
                      {col}{" "}
                      {comboSortBy === col
                        ? comboSortDir === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </button>
                    <input
                      value={comboFilters[col]}
                      onChange={(e) =>
                        setComboFilters((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded border border-ui-border bg-[#0f0f14] px-2 py-1 text-[11px] text-white"
                      placeholder="filter"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCombos.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-ui-border/30 font-garamond text-sm text-white/90"
                >
                  <td className="px-3 py-2 font-mono text-[11px]">{row.key}</td>
                  <td className="px-3 py-2">{row.left}</td>
                  <td className="px-3 py-2">{row.right}</td>
                  <td className="px-3 py-2">{row.leftType}</td>
                  <td className="px-3 py-2">{row.rightType}</td>
                  <td className="px-3 py-2">{row.prompt}</td>
                  <td className="px-3 py-2">
                    {row.fileSizeMb != null ? row.fileSizeMb.toFixed(1) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.durationMin != null ? row.durationMin.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
