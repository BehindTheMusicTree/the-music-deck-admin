import { NextResponse } from "next/server";

function apiOrigin(): string {
  const base = process.env.BACKEND_URL;
  if (!base?.trim()) throw new Error("BACKEND_URL is not set");
  return base.replace(/\/+$/, "");
}

export async function GET(): Promise<NextResponse> {
  const res = await fetch(`${apiOrigin()}/battle-music`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
