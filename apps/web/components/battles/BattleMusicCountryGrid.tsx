"use client";

import { useState } from "react";

type CircleSingle = {
  key: string;
  kind: "genreIntensity" | "country";
  label: string;
  genre: string;
  intensity: string;
  country: string;
  fileSizeMb: number | null;
  durationMin: number | null;
  version: number | null;
};

const COLOR = "#7a7fa0";

function LetterGroup({
  letter,
  rows,
  selectedKey,
  onSelect,
}: {
  letter: string;
  rows: CircleSingle[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <tr className="border-b border-ui-border/20">
      <td className="px-3 py-2 font-mono text-[13px] text-muted/50 align-top w-6 select-none">
        {letter}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => {
            const hasAudio = row.fileSizeMb != null;
            const isSel = selectedKey === row.key;
            return (
              <button
                key={row.key}
                type="button"
                onClick={() => onSelect(row.key)}
                className="rounded px-2.5 py-1 font-garamond text-sm transition-opacity"
                style={{
                  backgroundColor: hasAudio ? `${COLOR}28` : "rgba(255,255,255,0.04)",
                  border: isSel
                    ? `1px solid ${COLOR}`
                    : hasAudio
                      ? `1px solid ${COLOR}60`
                      : "1px solid rgba(255,255,255,0.08)",
                  color: hasAudio ? COLOR : "rgba(255,255,255,0.22)",
                  opacity: isSel ? 1 : undefined,
                }}
              >
                {row.country}
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

function CountryTable({
  title,
  rows,
  selectedKey,
  onSelect,
}: {
  title: string;
  rows: CircleSingle[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const byLetter = new Map<string, CircleSingle[]>();
  for (const row of rows) {
    const letter = row.country[0].toUpperCase();
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(row);
  }
  const letters = [...byLetter.keys()].sort();

  return (
    <div>
      <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
        {title}
      </div>
      <div className="overflow-auto rounded border border-ui-border/70 bg-[#12121a]/45">
        <table className="w-full text-left">
          <tbody>
            {letters.map((letter) => (
              <LetterGroup
                key={letter}
                letter={letter}
                rows={byLetter.get(letter)!}
                selectedKey={selectedKey}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BattleMusicCountryGrid({
  singles,
  regionNames,
}: {
  singles: CircleSingle[];
  regionNames: ReadonlySet<string>;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const countrySingles = singles.filter((s) => s.kind === "country");
  const countries = countrySingles.filter((s) => !regionNames.has(s.country));
  const regions   = countrySingles.filter((s) =>  regionNames.has(s.country));

  const selected = countrySingles.find((s) => s.key === selectedKey) ?? null;

  function handleSelect(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
        <CountryTable
          title="Countries"
          rows={countries}
          selectedKey={selectedKey}
          onSelect={handleSelect}
        />
        {regions.length > 0 && (
          <CountryTable
            title="Regions"
            rows={regions}
            selectedKey={selectedKey}
            onSelect={handleSelect}
          />
        )}
      </div>

      {selected && (
        <div className="rounded border border-ui-border bg-[#12121a]/80 p-4 max-w-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="font-cinzel text-sm tracking-[2px]"
                style={{ color: COLOR }}
              >
                {selected.country}
              </div>
              <div className="font-mono text-[11px] text-muted mt-0.5">
                {selected.key}
              </div>
            </div>
            <button
              type="button"
              className="font-mono text-lg text-muted hover:text-white leading-none shrink-0"
              onClick={() => setSelectedKey(null)}
            >
              ×
            </button>
          </div>

          {selected.fileSizeMb != null ? (
            <div className="mt-3">
              <div className="font-mono text-[11px] text-muted/80 mb-2">
                {selected.fileSizeMb.toFixed(1)} MB
                {selected.durationMin != null &&
                  ` · ${selected.durationMin.toFixed(1)} min`}
                {` · v${selected.version ?? 1}`}
              </div>
              <audio
                controls
                className="w-full"
                src={`/api/battle-music/${selected.key}/audio?version=${selected.version ?? 1}`}
              />
            </div>
          ) : (
            <div className="font-garamond italic text-muted/60 text-sm mt-2">
              No audio uploaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}
