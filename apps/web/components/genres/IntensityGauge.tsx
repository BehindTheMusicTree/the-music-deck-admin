"use client";

import type { CSSProperties } from "react";
import type { Intensity } from "@/lib/genres";
import { intensityLevelIndex } from "@/lib/genres";
import styles from "../cards/Card.module.css";

/**
 * Same intensity gauge as on the card stats row (triangle track, gradient fill,
 * percentage under the cursor). Reuses `Card.module.css` intensity classes.
 */
export default function IntensityGauge({
  intensity,
  small,
  className,
}: {
  intensity: Intensity | null | undefined;
  small?: boolean;
  className?: string;
}) {
  const idx = intensity ? intensityLevelIndex(intensity) : null;
  const pct = idx ? (idx / 4) * 100 : 0;

  const gauge = (
    <>
      <div
        className={styles.intensitySong}
        style={
          idx
            ? ({
                ["--intensity-pct" as string]: String(Math.round(pct)),
              } as CSSProperties)
            : undefined
        }
      >
        {idx ? (
          <div className={styles.intensityFill} style={{ width: `${pct}%` }}>
            <div className={styles.intensityFillInner} />
          </div>
        ) : null}
      </div>
      <div className={styles.intensityNoteRow}>
        {idx ? (
          <span
            className={styles.intensityNote}
            style={
              pct >= 99.5
                ? {
                    left: "100%",
                    transform: "translateX(-100%)",
                  }
                : { left: `${pct}%`, transform: "translateX(-50%)" }
            }
          >
            {Math.round(pct)}%
          </span>
        ) : (
          <span className={styles.intensityNoteMuted}>—</span>
        )}
      </div>
    </>
  );

  const inner = small ? <div className={styles.statsSm}>{gauge}</div> : gauge;

  if (className) {
    return <div className={className}>{inner}</div>;
  }
  return inner;
}
