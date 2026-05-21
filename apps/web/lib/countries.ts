import type { GenreTheme } from "@/lib/card-theme-types";
import {
  cssBritanyRepeating,
  cssHorizontalTricolorEqual,
  cssJapanHinomaru,
  cssSpainHorizontal,
  cssVerticalTricolorEqual,
  cssVerticalTricolorFrance,
  cssVerticalTwoBandEqual,
  tarnishHex,
} from "@/lib/flag-gradients";

// Tarnish helpers — each matches the brightness/saturate/opacity originally in frameFilter+frameOpacity.
const t78 = (h: string) => tarnishHex(h, 0.9, 0.78, 0.7); // France, Spain, Italy, Britany
const t80 = (h: string) => tarnishHex(h, 0.95, 0.8, 0.7); // Mexico
const t80j = (h: string) => tarnishHex(h, 0.97, 0.8, 0.7); // Japan
const t82 = (h: string) => tarnishHex(h, 0.95, 0.82, 0.7); // Netherlands, Algeria
const t82e = (h: string) => tarnishHex(h, 0.96, 0.82, 0.72); // England
const t84 = (h: string) => tarnishHex(h, 0.95, 0.84, 0.7); // Germany
const t88 = (h: string) => tarnishHex(h, 0.96, 0.88, 0.7); // Peru, Russia
const t90 = (h: string) => tarnishHex(h, 0.95, 0.9, 0.7); // Switzerland

// ---------------------------------------------------------------------------
// Canonical country definitions — single source of truth for World cards.
// Add a new entry here to register a country; everything else derives from it.
// ---------------------------------------------------------------------------

export interface CountryDef {
  theme: GenreTheme;
  /** Preferred card shell for border rendering. */
  defaultCardShell: "flat" | "r90";
  flag: {
    /** Explicit assets for the flat shell (`cardFlagFlat`). */
    flat: {
      border: string;
      bg?: string;
      backgroundPosition?: string;
    };
    /** Explicit assets for the r90 shell (`cardFlagUsR90`). */
    r90: {
      border: string;
      bg?: string;
      backgroundPosition?: string;
    };
  };
  pip?: {
    sym: string;
    color: string;
    size?: number;
    /** Optional custom SVG mark (uses `currentColor`). */
    svg?: string;
    /** Overrides the default pip background (solid theme.border). */
    bg?: string;
  };
}

const GLOBE_ICON =
  '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="8" cy="8" rx="3" ry="6" fill="none" stroke="currentColor" stroke-width=".8"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width=".8"/></svg>';

export const USA_FLAG_PATH = "/card-artworks/flag-usa.webp";
const PUERTO_RICO_FLAG_PATH = "/card-artworks/flag-puerto-rico.svg";
const PUERTO_RICO_FLAG_URL = `url('${PUERTO_RICO_FLAG_PATH}')`;
// Pre-tarnished SVG data URIs — colours already reflect brightness/saturate/opacity tarnish
// so no runtime CSS filter is needed (t82e for England, t90 for Switzerland).
const ENGLAND_FLAG_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23b3b3b4'/%3E%3Crect x='120' y='0' width='60' height='200' fill='%237b1325'/%3E%3Crect x='0' y='70' width='300' height='60' fill='%237b1325'/%3E%3C/svg%3E\")";
/** Greek cross inset from edges (federal / civil flag style, not edge-to-edge). */
const SWITZERLAND_FLAG_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'%3E%3Crect width='30' height='20' fill='%2389070c'/%3E%3Crect x='13' y='4' width='4' height='12' fill='%23acacad'/%3E%3Crect x='5' y='8' width='20' height='4' fill='%23acacad'/%3E%3C/svg%3E\")";

export const COUNTRY_DATA: Record<string, CountryDef> = {
  USA: {
    theme: {
      border: "#B22234",
      headerBg: "#060c18",
      textMain: "#f1eee6",
      textBody: "#d2cfc6",
      parchStrip: "#e8d6cf",
      parchAbility: "#efe1d9",
      barPop: ["#B22234", "#e84455"],
      barExp: ["#3C3B6E", "#6060cc"],
      barGlowPop: "rgba(178,34,52,.85)",
      barGlowExp: "rgba(96,96,204,.75)",
      frameBorder: `url('${USA_FLAG_PATH}')`,
      frameBg: `url('${USA_FLAG_PATH}')`,
      frameRotateR90: true,
      frameFilter: "saturate(0.78) brightness(0.9) contrast(1.03)",
      frameOpacity: 0.7,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: { border: `url('${USA_FLAG_PATH}')` },
      r90: { border: `url('${USA_FLAG_PATH}')` },
    },
    pip: { sym: "★", color: "#1a1a2e" },
  },

  Mexico: {
    theme: {
      border: "#006847",
      headerBg: "#0a0c10",
      textMain: "#f2f4f2",
      textBody: "#cfd4d0",
      parchStrip: "#dce4dd",
      parchAbility: "#e8efe8",
      barPop: ["#006847", "#2a9868"],
      barExp: ["#CE1126", "#e83040"],
      barGlowPop: "rgba(0,104,71,.85)",
      barGlowExp: "rgba(206,17,38,.75)",
      frameBorder: cssVerticalTricolorEqual(
        t80("#006847"),
        t80("#FFFFFF"),
        t80("#CE1126"),
      ),
      frameBg: cssVerticalTricolorEqual(
        t80("#006847"),
        t80("#FFFFFF"),
        t80("#CE1126"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssVerticalTricolorEqual(
          t80("#006847"),
          t80("#FFFFFF"),
          t80("#CE1126"),
        ),
        bg: cssVerticalTricolorEqual(
          t80("#006847"),
          t80("#FFFFFF"),
          t80("#CE1126"),
        ),
      },
      r90: {
        border: cssVerticalTricolorEqual(
          t80("#006847"),
          t80("#FFFFFF"),
          t80("#CE1126"),
        ),
        bg: cssVerticalTricolorEqual(
          t80("#006847"),
          t80("#FFFFFF"),
          t80("#CE1126"),
        ),
      },
    },
    // Use the flag-filled diamond for Mexico (no custom symbol override).
  },

  Peru: {
    theme: {
      border: "#D91023",
      headerBg: "#0a0c10",
      textMain: "#f4f2f2",
      textBody: "#ded8d8",
      parchStrip: "#e8dede",
      parchAbility: "#efe8e8",
      barPop: ["#D91023", "#e84850"],
      barExp: ["#9a1420", "#c42030"],
      barGlowPop: "rgba(217,16,35,.85)",
      barGlowExp: "rgba(154,20,32,.75)",
      frameBorder: cssVerticalTricolorEqual(
        t88("#D91023"),
        t88("#FFFFFF"),
        t88("#D91023"),
      ),
      frameBg: cssVerticalTricolorEqual(
        t88("#D91023"),
        t88("#FFFFFF"),
        t88("#D91023"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssVerticalTricolorEqual(
          t88("#D91023"),
          t88("#FFFFFF"),
          t88("#D91023"),
        ),
        bg: cssVerticalTricolorEqual(
          t88("#D91023"),
          t88("#FFFFFF"),
          t88("#D91023"),
        ),
      },
      r90: {
        border: cssVerticalTricolorEqual(
          t88("#D91023"),
          t88("#FFFFFF"),
          t88("#D91023"),
        ),
        bg: cssVerticalTricolorEqual(
          t88("#D91023"),
          t88("#FFFFFF"),
          t88("#D91023"),
        ),
      },
    },
  },

  France: {
    theme: {
      border: "#0055A4",
      headerBg: "#04091a",
      textMain: "#eceaf2",
      textBody: "#ceccd6",
      parchStrip: "#d7dde0",
      parchAbility: "#e3e8ea",
      barPop: ["#0055A4", "#4488ee"],
      barExp: ["#EF4135", "#ff7066"],
      barGlowPop: "rgba(0,85,164,.85)",
      barGlowExp: "rgba(239,65,53,.75)",
      frameBorder: cssVerticalTricolorFrance(
        t78("#0055A4"),
        t78("#FFFFFF"),
        t78("#EF4135"),
      ),
      frameBg: cssVerticalTricolorFrance(
        t78("#0055A4"),
        t78("#FFFFFF"),
        t78("#EF4135"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssVerticalTricolorFrance(
          t78("#0055A4"),
          t78("#FFFFFF"),
          t78("#EF4135"),
        ),
        bg: cssVerticalTricolorFrance(
          t78("#0055A4"),
          t78("#FFFFFF"),
          t78("#EF4135"),
        ),
      },
      r90: {
        border: cssVerticalTricolorFrance(
          t78("#0055A4"),
          t78("#FFFFFF"),
          t78("#EF4135"),
        ),
        bg: cssVerticalTricolorFrance(
          t78("#0055A4"),
          t78("#FFFFFF"),
          t78("#EF4135"),
        ),
      },
    },
    pip: { sym: "⚜", color: "#1a2a0a", size: 19 },
  },

  Spain: {
    theme: {
      border: "#AA151B",
      headerBg: "#120606",
      textMain: "#ffffff",
      textBody: "#dddddd",
      parchStrip: "#e5d1cb",
      parchAbility: "#edded7",
      barPop: ["#AA151B", "#e03030"],
      barExp: ["#2a6e2a", "#50b050"],
      barGlowPop: "rgba(170,21,27,.85)",
      barGlowExp: "rgba(80,176,80,.75)",
      frameBorder: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
      frameBg: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
        bg: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
      },
      r90: {
        border: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
        bg: `linear-gradient(to bottom, ${t78("#AA151B")} 0%, ${t78("#AA151B")} 25%, ${t78("#F1BF00")} 25%, ${t78("#F1BF00")} 75%, ${t78("#AA151B")} 75%, ${t78("#AA151B")} 100%)`,
      },
    },
  },

  Italy: {
    theme: {
      border: "#009246",
      headerBg: "#0a1014",
      textMain: "#f0f2ee",
      textBody: "#cfd4d0",
      parchStrip: "#dce5de",
      parchAbility: "#e8efe9",
      barPop: ["#009246", "#2eb86e"],
      barExp: ["#CE2B37", "#e85858"],
      barGlowPop: "rgba(0,146,70,.85)",
      barGlowExp: "rgba(206,43,55,.75)",
      frameBorder: cssVerticalTricolorEqual(
        t78("#009246"),
        t78("#FFFFFF"),
        t78("#CE2B37"),
      ),
      frameBg: cssVerticalTricolorEqual(
        t78("#009246"),
        t78("#FFFFFF"),
        t78("#CE2B37"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssVerticalTricolorEqual(
          t78("#009246"),
          t78("#FFFFFF"),
          t78("#CE2B37"),
        ),
        bg: cssVerticalTricolorEqual(
          t78("#009246"),
          t78("#FFFFFF"),
          t78("#CE2B37"),
        ),
      },
      r90: {
        border: cssVerticalTricolorEqual(
          t78("#009246"),
          t78("#FFFFFF"),
          t78("#CE2B37"),
        ),
        bg: cssVerticalTricolorEqual(
          t78("#009246"),
          t78("#FFFFFF"),
          t78("#CE2B37"),
        ),
      },
    },
  },

  Japan: {
    theme: {
      border: "#BC002D",
      headerBg: "#0c0a0c",
      textMain: "#f5f3f0",
      textBody: "#d8d4d0",
      parchStrip: "#e8e4e0",
      parchAbility: "#f0ece8",
      barPop: ["#BC002D", "#e02840"],
      barExp: ["#1a1a28", "#404058"],
      barGlowPop: "rgba(188,0,45,.85)",
      barGlowExp: "rgba(40,40,72,.75)",
      frameBorder: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
      frameBg: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
        bg: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
      },
      r90: {
        border: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
        bg: `radial-gradient(circle at 50% 50%, ${t80j("#BC002D")} 0%, ${t80j("#BC002D")} 24%, ${t80j("#FFFFFF")} 24.5%, ${t80j("#FFFFFF")} 100%)`,
      },
    },
  },

  England: {
    theme: {
      border: "#C8102E",
      headerBg: "#0c0a0a",
      textMain: "#f4f2ee",
      textBody: "#d6d2cc",
      parchStrip: "#e6e2dc",
      parchAbility: "#eeebe5",
      barPop: ["#C8102E", "#e83040"],
      barExp: ["#1a2a48", "#3a5088"],
      barGlowPop: "rgba(200,16,46,.85)",
      barGlowExp: "rgba(26,42,72,.75)",
      frameBorder: ENGLAND_FLAG_DATA_URI,
      frameBg: ENGLAND_FLAG_DATA_URI,
      frameBackgroundPosition: "center center",
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: ENGLAND_FLAG_DATA_URI,
        bg: ENGLAND_FLAG_DATA_URI,
        backgroundPosition: "center center",
      },
      r90: {
        border: ENGLAND_FLAG_DATA_URI,
        bg: ENGLAND_FLAG_DATA_URI,
        backgroundPosition: "center center",
      },
    },
  },

  Netherlands: {
    theme: {
      border: "#AE1C28",
      headerBg: "#100a0a",
      textMain: "#f4f2ee",
      textBody: "#d8d4cf",
      parchStrip: "#e6dfd8",
      parchAbility: "#eee8e1",
      barPop: ["#AE1C28", "#d84450"],
      barExp: ["#21468B", "#3f6cc8"],
      barGlowPop: "rgba(174,28,40,.85)",
      barGlowExp: "rgba(33,70,139,.75)",
      frameBorder: cssHorizontalTricolorEqual(
        t82("#AE1C28"),
        t82("#FFFFFF"),
        t82("#21468B"),
      ),
      frameBg: cssHorizontalTricolorEqual(
        t82("#AE1C28"),
        t82("#FFFFFF"),
        t82("#21468B"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssHorizontalTricolorEqual(
          t82("#AE1C28"),
          t82("#FFFFFF"),
          t82("#21468B"),
        ),
        bg: cssHorizontalTricolorEqual(
          t82("#AE1C28"),
          t82("#FFFFFF"),
          t82("#21468B"),
        ),
      },
      r90: {
        border: cssHorizontalTricolorEqual(
          t82("#AE1C28"),
          t82("#FFFFFF"),
          t82("#21468B"),
        ),
        bg: cssHorizontalTricolorEqual(
          t82("#AE1C28"),
          t82("#FFFFFF"),
          t82("#21468B"),
        ),
      },
    },
  },

  Germany: {
    theme: {
      border: "#000000",
      headerBg: "#0b0b0b",
      textMain: "#f3f0ea",
      textBody: "#d7d3cc",
      parchStrip: "#e3ddd3",
      parchAbility: "#ece6dc",
      barPop: ["#000000", "#3a3a3a"],
      barExp: ["#DD0000", "#ff3a3a"],
      barGlowPop: "rgba(58,58,58,.8)",
      barGlowExp: "rgba(221,0,0,.75)",
      frameBorder: cssHorizontalTricolorEqual(
        t84("#000000"),
        t84("#DD0000"),
        t84("#FFCE00"),
      ),
      frameBg: cssHorizontalTricolorEqual(
        t84("#000000"),
        t84("#DD0000"),
        t84("#FFCE00"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssHorizontalTricolorEqual(
          t84("#000000"),
          t84("#DD0000"),
          t84("#FFCE00"),
        ),
        bg: cssHorizontalTricolorEqual(
          t84("#000000"),
          t84("#DD0000"),
          t84("#FFCE00"),
        ),
      },
      r90: {
        border: cssHorizontalTricolorEqual(
          t84("#000000"),
          t84("#DD0000"),
          t84("#FFCE00"),
        ),
        bg: cssHorizontalTricolorEqual(
          t84("#000000"),
          t84("#DD0000"),
          t84("#FFCE00"),
        ),
      },
    },
  },

  Switzerland: {
    theme: {
      border: "#DA0208",
      headerBg: "#14080a",
      textMain: "#f4f2f2",
      textBody: "#d8d4d4",
      parchStrip: "#e8dede",
      parchAbility: "#f0e8e8",
      barPop: ["#DA0208", "#f03840"],
      barExp: ["#1a1a1e", "#48485c"],
      barGlowPop: "rgba(218,2,8,.85)",
      barGlowExp: "rgba(50,50,64,.75)",
      frameBorder: SWITZERLAND_FLAG_DATA_URI,
      frameBg: SWITZERLAND_FLAG_DATA_URI,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: SWITZERLAND_FLAG_DATA_URI,
        bg: SWITZERLAND_FLAG_DATA_URI,
      },
      r90: { border: SWITZERLAND_FLAG_DATA_URI, bg: SWITZERLAND_FLAG_DATA_URI },
    },
  },

  Russia: {
    theme: {
      border: "#0039A6",
      headerBg: "#0a0c12",
      textMain: "#e8ecfa",
      textBody: "#c8cadc",
      parchStrip: "#dce0e8",
      parchAbility: "#e6eaf2",
      barPop: ["#D52B1E", "#e84840"],
      barExp: ["#0039A6", "#4068c8"],
      barGlowPop: "rgba(213,43,30,.85)",
      barGlowExp: "rgba(0,57,166,.75)",
      frameBorder: cssHorizontalTricolorEqual(
        t88("#FFFFFF"),
        t88("#0039A6"),
        t88("#D52B1E"),
      ),
      frameBg: cssHorizontalTricolorEqual(
        t88("#FFFFFF"),
        t88("#0039A6"),
        t88("#D52B1E"),
      ),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssHorizontalTricolorEqual(
          t88("#FFFFFF"),
          t88("#0039A6"),
          t88("#D52B1E"),
        ),
        bg: cssHorizontalTricolorEqual(
          t88("#FFFFFF"),
          t88("#0039A6"),
          t88("#D52B1E"),
        ),
      },
      r90: {
        border: cssHorizontalTricolorEqual(
          t88("#FFFFFF"),
          t88("#0039A6"),
          t88("#D52B1E"),
        ),
        bg: cssHorizontalTricolorEqual(
          t88("#FFFFFF"),
          t88("#0039A6"),
          t88("#D52B1E"),
        ),
      },
    },
  },

  "Puerto Rico": {
    theme: {
      border: "#002B7C",
      headerBg: "#0a0c18",
      textMain: "#f4f4f8",
      textBody: "#d0d4e0",
      parchStrip: "#dce0ea",
      parchAbility: "#e8ecf4",
      barPop: ["#EF3340", "#ff5060"],
      barExp: ["#002B7C", "#4068c0"],
      barGlowPop: "rgba(239,51,64,.85)",
      barGlowExp: "rgba(0,43,124,.75)",
      frameBorder: PUERTO_RICO_FLAG_URL,
      frameBg: PUERTO_RICO_FLAG_URL,
      /** With uniform border stretch, center keeps the hoist triangle readable on the left edge. */
      frameBackgroundPosition: "center center",
      frameFilter: "saturate(0.88) brightness(0.96) contrast(1.03)",
      frameOpacity: 0.7,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: PUERTO_RICO_FLAG_URL,
        bg: PUERTO_RICO_FLAG_URL,
        backgroundPosition: "center center",
      },
      r90: {
        border: PUERTO_RICO_FLAG_URL,
        bg: PUERTO_RICO_FLAG_URL,
        backgroundPosition: "center center",
      },
    },
  },

  Algeria: {
    theme: {
      border: "#006233",
      headerBg: "#0a100c",
      textMain: "#f2f4f2",
      textBody: "#cfd6d0",
      parchStrip: "#dce4dc",
      parchAbility: "#e8f0e8",
      barPop: ["#006233", "#2a9860"],
      barExp: ["#D21034", "#e83850"],
      barGlowPop: "rgba(0,98,51,.85)",
      barGlowExp: "rgba(210,16,52,.75)",
      frameBorder: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
      frameBg: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
      icon: GLOBE_ICON,
    },
    defaultCardShell: "r90",
    flag: {
      flat: {
        border: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
        bg: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
      },
      r90: {
        border: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
        bg: cssVerticalTwoBandEqual(t82("#006233"), t82("#FFFFFF")),
      },
    },
  },

  // Gwenn-ha-Du: 11 alternating black/white horizontal stripes + canton hermine
  Britany: {
    theme: {
      border: "#222222",
      headerBg: "#0a0a0a",
      textMain: "#f8f7f3",
      textBody: "#dddcd7",
      parchStrip: "#dad2be",
      parchAbility: "#e4ddcb",
      barPop: ["#333333", "#666666"],
      barExp: ["#999999", "#cccccc"],
      barGlowPop: "rgba(50,50,50,.85)",
      barGlowExp: "rgba(180,180,180,.75)",
      frameBorder: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
      frameBg: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
      icon: GLOBE_ICON,
    },
    defaultCardShell: "flat",
    flag: {
      flat: {
        border: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
        bg: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
      },
      r90: {
        border: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
        bg: `repeating-linear-gradient(to bottom, ${t78("#000000")} 0%, ${t78("#000000")} 9.09%, ${t78("#ffffff")} 9.09%, ${t78("#ffffff")} 18.18%)`,
      },
    },
    pip: {
      sym: "✦",
      color: "#222222",
      size: 17,
      svg: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.1c.55 1.75 1.2 2.46 2.8 3.02-1.6.56-2.25 1.27-2.8 3.02-.55-1.75-1.2-2.46-2.8-3.02 1.6-.56 2.25-1.27 2.8-3.02zm0 6.65c.26.8.56 1.13 1.3 1.39-.74.26-1.04.59-1.3 1.39-.26-.8-.56-1.13-1.3-1.39.74-.26 1.04-.59 1.3-1.39z" fill="currentColor"/><circle cx="3.15" cy="8.95" r=".78" fill="currentColor"/><circle cx="8.85" cy="8.95" r=".78" fill="currentColor"/></svg>',
      bg: "repeating-linear-gradient(to bottom, #000000 0%, #000000 50%, #ffffff 50%, #ffffff 100%)",
    },
  },
};

// ---------------------------------------------------------------------------
// Map placement (plate carrée: x = lon + 180°, y = 90° − lat in SVG space)
// ---------------------------------------------------------------------------

/** Representative WGS-84 point for each registered country / region. */
export const COUNTRY_MAP_POINT = {
  USA: { lon: -98.35, lat: 39.5 },
  Mexico: { lon: -99.13, lat: 19.43 },
  Peru: { lon: -77.04, lat: -12.05 },
  France: { lon: 2.35, lat: 46.8 },
  Spain: { lon: -3.7, lat: 40.2 },
  Italy: { lon: 12.5, lat: 42.5 },
  Japan: { lon: 138.25, lat: 36.2 },
  England: { lon: -1.5, lat: 52.5 },
  Netherlands: { lon: 5.29, lat: 52.13 },
  Germany: { lon: 10.45, lat: 51.17 },
  Switzerland: { lon: 8.23, lat: 46.82 },
  Algeria: { lon: 2.65, lat: 28.35 },
  "Puerto Rico": { lon: -66.45, lat: 18.22 },
  Russia: { lon: 37.62, lat: 55.75 },
  Britany: { lon: -3.2, lat: 48.15 },
} as const satisfies Record<
  keyof typeof COUNTRY_DATA,
  { lon: number; lat: number }
>;

export function countryToMapSvg(
  lon: number,
  lat: number,
): { x: number; y: number } {
  return { x: lon + 180, y: 90 - lat };
}

// ---------------------------------------------------------------------------
// Derived helpers — consumed by Card.tsx and genres.ts
// ---------------------------------------------------------------------------

export function themeForCountry(country: string): GenreTheme | undefined {
  return COUNTRY_DATA[country]?.theme;
}

type CountryCardShell = "flat" | "r90";

function resolveCountryFlagVariant(
  def: CountryDef,
  shell: CountryCardShell,
): { border: string; bg?: string; backgroundPosition?: string } {
  const flat = def.flag.flat;
  if (shell === "flat") return flat;
  return def.flag.r90;
}

export function countryPreferredCardShell(
  country: string | undefined,
): CountryCardShell {
  if (!country) return "flat";
  const def = COUNTRY_DATA[country];
  if (!def) return "flat";
  return def.defaultCardShell;
}

export function countryFlagForShell(
  country: string | undefined,
  shell: CountryCardShell,
): { border?: string; bg?: string; backgroundPosition?: string } {
  if (!country) return {};
  const def = COUNTRY_DATA[country];
  if (!def) return {};
  const variant = resolveCountryFlagVariant(def, shell);
  return {
    border: variant.border,
    bg: variant.bg ?? variant.border,
    backgroundPosition: variant.backgroundPosition,
  };
}

export const FLAG_BORDERS: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_DATA).map(([k, v]) => [
    k,
    resolveCountryFlagVariant(v, "flat").border,
  ]),
);

export const FLAG_BG: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_DATA).map(([k, v]) => {
    const flat = resolveCountryFlagVariant(v, "flat");
    return [k, flat.bg ?? flat.border] as const;
  }),
);

export const FLAG_PIP_SYMBOL: Record<
  string,
  { sym: string; color: string; size?: number; svg?: string }
> = Object.fromEntries(
  Object.entries(COUNTRY_DATA)
    .filter(([, v]) => v.pip)
    .map(([k, v]) => [
      k,
      {
        sym: v.pip!.sym,
        color: v.pip!.color,
        size: v.pip!.size,
        svg: v.pip!.svg,
      },
    ]),
);

export const FLAG_PIP_BG: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_DATA).map(([k, v]) => [
    k,
    v.pip?.bg ?? resolveCountryFlagVariant(v, "flat").border,
  ]),
);
