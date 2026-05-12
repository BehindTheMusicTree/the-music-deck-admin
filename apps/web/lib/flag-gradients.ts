/**
 * CSS `linear-gradient` / `radial-gradient` strings for country frame & pip flags.
 * Centralises stop math so tricolores stay consistent when edited.
 */

/**
 * Pre-compute a tarnished hex colour, approximating the visual result of the CSS
 * `brightness(b) saturate(s) contrast(1.03) opacity(o)` filter chain applied over a
 * near-black background.  Use this to bake the tarnish into the flag gradient data
 * instead of applying a runtime CSS `filter` that can bleed onto card content.
 */
export function tarnishHex(
  hex: string,
  brightness: number,
  saturate: number,
  opacity: number,
): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // brightness
  const rb = r * brightness;
  const gb = g * brightness;
  const bb = b * brightness;
  // saturate: lerp toward perceived luminance
  const lum = 0.2126 * rb + 0.7152 * gb + 0.0722 * bb;
  const rs = lum + (rb - lum) * saturate;
  const gs = lum + (gb - lum) * saturate;
  const bs = lum + (bb - lum) * saturate;
  // opacity blend over near-black (#0a0a0e)
  const fr = Math.round(Math.min(255, rs * opacity + 10 * (1 - opacity)));
  const fg = Math.round(Math.min(255, gs * opacity + 10 * (1 - opacity)));
  const fb = Math.round(Math.min(255, bs * opacity + 14 * (1 - opacity)));
  return `#${fr.toString(16).padStart(2, "0")}${fg.toString(16).padStart(2, "0")}${fb.toString(16).padStart(2, "0")}`;
}

/** Three equal vertical stripes (hoist left). */
export function cssVerticalTricolorEqual(
  left: string,
  mid: string,
  right: string,
): string {
  return `linear-gradient(to right, ${left} 0%, ${left} 33.33%, ${mid} 33.33%, ${mid} 66.66%, ${right} 66.66%, ${right} 100%)`;
}

/** France: slightly asymmetric white band (common CSS workaround). */
export function cssVerticalTricolorFrance(
  left: string,
  mid: string,
  right: string,
): string {
  return `linear-gradient(to right, ${left} 0%, ${left} 33.34%, ${mid} 33.34%, ${mid} 66.66%, ${right} 66.66%, ${right} 100%)`;
}

/** Three equal horizontal stripes (top to bottom). */
export function cssHorizontalTricolorEqual(
  top: string,
  mid: string,
  bot: string,
): string {
  return `linear-gradient(to bottom, ${top} 0%, ${top} 33.33%, ${mid} 33.33%, ${mid} 66.66%, ${bot} 66.66%, ${bot} 100%)`;
}

/** Spain: wide yellow band between two red bands. */
export function cssSpainHorizontal(): string {
  return "linear-gradient(to bottom, #AA151B 0%, #AA151B 25%, #F1BF00 25%, #F1BF00 75%, #AA151B 75%, #AA151B 100%)";
}

/** Two equal vertical stripes. */
export function cssVerticalTwoBandEqual(left: string, right: string): string {
  return `linear-gradient(to right, ${left} 0%, ${left} 50%, ${right} 50%, ${right} 100%)`;
}

export function cssJapanHinomaru(): string {
  return "radial-gradient(circle at 50% 50%, #BC002D 0%, #BC002D 24%, #FFFFFF 24.5%, #FFFFFF 100%)";
}

/** Gwenn-ha-Du–style horizontal stripes. */
export function cssBritanyRepeating(): string {
  return "repeating-linear-gradient(to bottom, #000000 0%, #000000 9.09%, #ffffff 9.09%, #ffffff 18.18%)";
}
