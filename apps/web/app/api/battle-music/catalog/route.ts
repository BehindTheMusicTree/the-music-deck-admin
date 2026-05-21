import { NextResponse } from "next/server";

function apiOrigin(): string {
  const base = process.env.BACKEND_URL;
  if (!base?.trim()) throw new Error("BACKEND_URL is not set");
  return base.replace(/\/+$/, "");
}

export async function GET(): Promise<NextResponse> {
  const res = await fetch(`${apiOrigin()}/battle-music/catalog`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    return NextResponse.json({ genres: [], territories: [] }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
