"use client";

import { createRoot, type Root } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SUBGENRES, type CountrySubgenre, WORLD_THEMES } from "@/lib/genres";
import { COUNTRY_MAP_POINT } from "@/lib/countries";
import type {
  Map as MaplibreMap,
  MapLayerMouseEvent,
  StyleSpecification,
} from "maplibre-gl";
import type { GenreTheme } from "@/lib/card-theme-types";
import { flatShellFlagBackgroundSize } from "@/lib/flag-background-size";
import type { Feature, FeatureCollection } from "geojson";

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  name: "osm-tiles",
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/** SW then NE (lng, lat) for `fitBounds`. */
const WORLD_FIT: [[number, number], [number, number]] = [
  [-175, -58],
  [175, 70],
];

const MIN_MAP_PX = 80;

function fitWorldInView(map: MaplibreMap, container: HTMLElement): boolean {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w < MIN_MAP_PX || h < MIN_MAP_PX) return false;
  map.resize();
  map.fitBounds(WORLD_FIT, {
    padding: 32,
    duration: 0,
    maxZoom: 6,
  });
  return true;
}

const SUBGENRE_SOURCE_ID = "subgenres";
const CLUSTER_LAYER_ID = "subgenre-clusters";
const CLUSTER_COUNT_LAYER_ID = "subgenre-cluster-count";
const POINT_LAYER_ID = "subgenre-point";

type ClusterGeoSource = {
  type: "geojson";
  getClusterExpansionZoom: (clusterId: number) => Promise<number>;
  getClusterLeaves: (
    clusterId: number,
    limit: number,
    offset: number,
  ) => Promise<Feature[]>;
};

/** One map point per country/region that has at least one listed country-native subgenre. */
function countryRegionsToGeoJson(subs: CountrySubgenre[]): FeatureCollection {
  const byCountry = new Map<string, CountrySubgenre[]>();
  for (const s of subs) {
    const country = s.parentA;
    const geo = COUNTRY_MAP_POINT[country as keyof typeof COUNTRY_MAP_POINT];
    if (!geo) continue;
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country)!.push(s);
  }

  const features: Feature[] = [];
  for (const [country, list] of byCountry) {
    const geo = COUNTRY_MAP_POINT[country as keyof typeof COUNTRY_MAP_POINT]!;
    const theme = WORLD_THEMES[country as keyof typeof WORLD_THEMES];
    const pinColor =
      theme?.border && /^#[0-9a-fA-F]{6}$/.test(theme.border)
        ? theme.border
        : list[0]!.color;
    features.push({
      type: "Feature",
      id: country,
      properties: {
        country,
        pinColor,
      },
      geometry: {
        type: "Point",
        coordinates: [geo.lon, geo.lat],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function subgenreNamesForCountry(
  country: string,
  allCountrySubs: CountrySubgenre[],
): string[] {
  return allCountrySubs
    .filter((s) => s.parentA === country)
    .map((s) => s.n)
    .sort((a, b) => a.localeCompare(b));
}

/** Flag ribbon matching card shells — preview (no dimming filters). */
function PopupFlagSwatch({ theme }: { theme: GenreTheme }) {
  const flagLayer = theme.frameBorder;
  const flagBg = theme.frameBg;
  const rot = Boolean(theme.frameRotateR90 && (flagLayer || flagBg));

  if (rot && (flagBg ?? flagLayer)) {
    const src = (flagBg ?? flagLayer) as string;
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-md border border-black/25 bg-[rgba(4,6,9,0.92)]"
        style={{ width: 64, height: 40 }}
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 140,
            height: 88,
            transform: "translate(-50%,-50%) rotate(-90deg)",
            backgroundImage: `linear-gradient(transparent,transparent), ${src}`,
            backgroundSize: "100% 100%, cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    );
  }

  if (!flagLayer) return null;

  const borderFlagSize = flatShellFlagBackgroundSize(flagLayer);
  const bw = 6;
  return (
    <div
      className="shrink-0 rounded-md border border-black/25 shadow-sm"
      style={{
        width: 64,
        height: 38,
        background: `linear-gradient(transparent, transparent) padding-box, ${flagLayer} border-box`,
        border: `${bw}px solid transparent`,
        backgroundClip: "padding-box, border-box",
        backgroundOrigin: "padding-box, border-box",
        backgroundSize: `100% 100%, ${borderFlagSize}`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      aria-hidden
    />
  );
}

function CountryPopupBody({
  country,
  subgenres,
}: {
  country: string;
  subgenres: string[];
}) {
  const theme = WORLD_THEMES[country];
  return (
    <div className="px-1 py-0.5 text-white" style={{ minWidth: 200 }}>
      <div className="flex items-center gap-3 mb-3">
        {theme ? <PopupFlagSwatch theme={theme} /> : null}
        <div className="font-cinzel text-[17px] leading-tight tracking-[2px] text-white min-w-0 flex-1">
          {country}
        </div>
      </div>
      <div className="font-mono text-[9px] tracking-wide text-muted uppercase mb-1.5">
        Country-native subgenres
      </div>
      <ul className="m-0 list-none p-0 max-h-[min(48vh,260px)] overflow-y-auto space-y-1.5">
        {subgenres.map((name) => (
          <li
            key={name}
            className="font-garamond text-[15px] leading-snug text-white/90 border-b border-white/10 pb-1.5 last:border-0"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CountryPopupFromLeaves({
  leaves,
  allCountrySubs,
}: {
  leaves: Feature[];
  allCountrySubs: CountrySubgenre[];
}) {
  const countries = [
    ...new Set(
      leaves
        .map(
          (leaf) =>
            (leaf.properties as { country?: string } | null | undefined)
              ?.country,
        )
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (!countries.length) {
    return (
      <p className="font-garamond text-sm text-muted m-0 px-1 py-2">
        No regions in this cluster.
      </p>
    );
  }

  if (countries.length === 1) {
    const country = countries[0]!;
    return (
      <CountryPopupBody
        country={country}
        subgenres={subgenreNamesForCountry(country, allCountrySubs)}
      />
    );
  }

  return (
    <div className="max-h-[min(52vh,320px)] overflow-y-auto space-y-5 pr-1">
      {countries.map((country) => (
        <CountryPopupBody
          key={country}
          country={country}
          subgenres={subgenreNamesForCountry(country, allCountrySubs)}
        />
      ))}
    </div>
  );
}

type MaplibreModule = typeof import("maplibre-gl");
let maplibreRef: MaplibreModule | null = null;
async function loadMaplibre(): Promise<MaplibreModule> {
  if (!maplibreRef) {
    maplibreRef = await import("maplibre-gl");
  }
  return maplibreRef;
}

export default function WorldSubgenreMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onResetRef = useRef<(() => void) | null>(null);

  const countrySubs = useMemo(
    () => SUBGENRES.filter((s): s is CountrySubgenre => s.kind === "country"),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mapInstance: MaplibreMap | null = null;
    let activePopup: import("maplibre-gl").Popup | null = null;
    let activeRoot: Root | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const closeActivePopup = () => {
      activeRoot?.unmount();
      activeRoot = null;
      try {
        activePopup?.remove();
      } catch {
        /* already removed */
      }
      activePopup = null;
    };
    let cancelled = false;

    void (async () => {
      try {
        const M = await loadMaplibre();
        if (cancelled) return;
        const map = new M.Map({
          container,
          style: OSM_RASTER_STYLE,
          center: [0, 15],
          zoom: 0,
          minZoom: 0,
          maxZoom: 18,
        });
        if (cancelled) {
          map.remove();
          return;
        }
        mapInstance = map;

        map.addControl(
          new M.NavigationControl({ showCompass: true }),
          "top-right",
        );

        const scheduleWorldFit = () => {
          if (cancelled) return;
          fitWorldInView(map, container);
          requestAnimationFrame(() => {
            if (cancelled) return;
            fitWorldInView(map, container);
          });
          window.setTimeout(() => {
            if (cancelled) return;
            fitWorldInView(map, container);
          }, 120);
          window.setTimeout(() => {
            if (cancelled) return;
            fitWorldInView(map, container);
          }, 400);
        };

        map.once("load", () => {
          if (cancelled) return;
          map.scrollZoom.enable();
          map.doubleClickZoom.disable();
          scheduleWorldFit();

          const geojson = countryRegionsToGeoJson(countrySubs);
          map.addSource(SUBGENRE_SOURCE_ID, {
            type: "geojson",
            data: geojson,
            cluster: true,
            clusterMaxZoom: 15,
            clusterRadius: 52,
          });

          map.addLayer({
            id: CLUSTER_LAYER_ID,
            type: "circle",
            source: SUBGENRE_SOURCE_ID,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "rgba(52, 86, 132, 0.92)",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                15,
                3,
                18,
                6,
                22,
                12,
                28,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#e8eef8",
            },
          });

          map.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: "symbol",
            source: SUBGENRE_SOURCE_ID,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count}",
              "text-font": ["Open Sans Bold"],
              "text-size": 12,
            },
            paint: {
              "text-color": "#f4f7fc",
            },
          });

          map.addLayer({
            id: POINT_LAYER_ID,
            type: "circle",
            source: SUBGENRE_SOURCE_ID,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["get", "pinColor"],
              "circle-radius": 8,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "rgba(255,255,255,0.88)",
            },
          });

          const clusterLayers = [CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID];
          for (const lid of [...clusterLayers, POINT_LAYER_ID]) {
            map.on("mouseenter", lid, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", lid, () => {
              map.getCanvas().style.cursor = "";
            });
          }

          const geoSource = map.getSource(
            SUBGENRE_SOURCE_ID,
          ) as unknown as ClusterGeoSource;

          const openClusterLeavesPopup = (
            clusterId: number,
            coords: [number, number],
          ) => {
            void (async () => {
              try {
                const leaves = await geoSource.getClusterLeaves(
                  clusterId,
                  120,
                  0,
                );
                if (cancelled) return;
                closeActivePopup();
                const el = document.createElement("div");
                activeRoot = createRoot(el);
                activeRoot.render(
                  <CountryPopupFromLeaves
                    leaves={leaves}
                    allCountrySubs={countrySubs}
                  />,
                );
                activePopup = new M.Popup({
                  maxWidth: "320px",
                  closeButton: true,
                  closeOnClick: true,
                })
                  .setLngLat(coords)
                  .setDOMContent(el)
                  .addTo(map);
                activePopup.on("close", () => {
                  activeRoot?.unmount();
                  activeRoot = null;
                });
              } catch {
                /* ignore */
              }
            })();
          };

          const onClusterClick = (e: MapLayerMouseEvent) => {
            const feats = map.queryRenderedFeatures(e.point, {
              layers: clusterLayers,
            });
            const f = feats[0];
            if (!f?.properties || f.properties.cluster_id === undefined) return;
            const clusterId = f.properties.cluster_id as number;
            const coords = (
              f.geometry as { type: "Point"; coordinates: [number, number] }
            ).coordinates;
            void (async () => {
              try {
                const expansionZoom =
                  await geoSource.getClusterExpansionZoom(clusterId);
                if (cancelled) return;
                const z = map.getZoom();
                if (expansionZoom <= z + 0.05) {
                  openClusterLeavesPopup(clusterId, coords);
                  return;
                }
                closeActivePopup();
                map.easeTo({
                  center: coords,
                  zoom: Math.min(expansionZoom, map.getMaxZoom() ?? 18),
                  duration: 580,
                });
              } catch {
                /* ignore */
              }
            })();
          };

          map.on("click", CLUSTER_LAYER_ID, onClusterClick);
          map.on("click", CLUSTER_COUNT_LAYER_ID, onClusterClick);

          map.on("click", POINT_LAYER_ID, (e) => {
            const feats = map.queryRenderedFeatures(e.point, {
              layers: [POINT_LAYER_ID],
            });
            const f = feats[0];
            if (!f?.properties) return;
            const p = f.properties as { country: string };
            if (!p.country) return;
            const coords = (
              f.geometry as { type: "Point"; coordinates: [number, number] }
            ).coordinates;
            closeActivePopup();
            const el = document.createElement("div");
            activeRoot = createRoot(el);
            activeRoot.render(
              <CountryPopupBody
                country={p.country}
                subgenres={subgenreNamesForCountry(p.country, countrySubs)}
              />,
            );
            activePopup = new M.Popup({
              maxWidth: "240px",
              closeButton: true,
              closeOnClick: true,
              offset: 14,
            })
              .setLngLat(coords)
              .setDOMContent(el)
              .addTo(map);
            activePopup.on("close", () => {
              activeRoot?.unmount();
              activeRoot = null;
            });
          });

          map.on("click", (e) => {
            const hit = map.queryRenderedFeatures(e.point, {
              layers: [...clusterLayers, POINT_LAYER_ID],
            });
            if (!hit.length) closeActivePopup();
          });
        });

        onResetRef.current = () => {
          if (!mapInstance) return;
          mapInstance.resize();
          mapInstance.fitBounds(WORLD_FIT, {
            padding: 32,
            maxZoom: 6,
            duration: 450,
          });
        };

        map.on("dblclick", (e) => {
          e.preventDefault();
          onResetRef.current?.();
        });

        resizeObserver = new ResizeObserver(() => {
          if (cancelled || !mapInstance) return;
          mapInstance.resize();
        });
        resizeObserver.observe(container);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "The map could not be loaded",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      onResetRef.current = null;
      resizeObserver?.disconnect();
      activeRoot?.unmount();
      activeRoot = null;
      try {
        activePopup?.remove();
      } catch {
        /* */
      }
      activePopup = null;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
    };
  }, [countrySubs]);

  return (
    <div className="w-full max-w-[min(100%,1400px)] mx-auto flex flex-col items-center gap-5 mt-14 mb-6 px-3 sm:px-4">
      <div className="text-center max-w-[720px]">
        <div className="section-title mb-1.5">World map</div>
        <p className="font-garamond italic text-muted leading-[1.45] m-0">
          Each country or region has a single pin at an approximate
          representative point; opening the pin lists every country-native
          subgenre defined for that place.
        </p>
      </div>

      {loadError ? (
        <p className="font-mono text-sm text-red-300/90" role="alert">
          {loadError}
        </p>
      ) : null}

      <div
        className="w-full min-w-0 min-h-0"
        style={{ aspectRatio: "2.2 / 1" }}
      >
        <div
          ref={containerRef}
          className="h-full w-full min-w-0 min-h-[280px] sm:min-h-[360px] overflow-hidden rounded-[6px] border border-ui-border bg-[#0b1220] shadow-[inset_0_0_80px_rgba(0,0,0,.4)]"
        />
        <p className="mt-1.5 font-mono text-[9px] tracking-wide text-muted/50 text-right pr-0.5 m-0">
          Map data © OpenStreetMap contributors (ODbL) · use per{" "}
          <a
            className="text-white/50 underline offset-1 hover:text-white/70"
            href="https://wiki.openstreetmap.org/wiki/Tile_usage_policy"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap tile policy
          </a>
        </p>
      </div>

      <p className="font-mono text-[10px] tracking-wide text-muted/80 m-0 text-center">
        Scroll to zoom, drag to pan, double-click empty space to fit the world
        again. Pin colour follows the country flag border. Nearby regions
        cluster — click a cluster to zoom until it splits; when it cannot split
        further, a summary opens. Click a pin for that country or region and its
        subgenres. Click empty map to close popups.
      </p>
    </div>
  );
}
