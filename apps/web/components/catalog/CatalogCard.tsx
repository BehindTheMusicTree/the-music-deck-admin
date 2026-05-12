"use client";

import type { ComponentProps } from "react";
import Card from "@/components/cards/Card";

/** Shipped catalogue `Card`; pass `cardSongIndex` from the server-fetched graph. */
export default function CatalogCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} />;
}
