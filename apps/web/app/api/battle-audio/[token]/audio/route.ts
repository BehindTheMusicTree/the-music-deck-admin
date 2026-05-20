import { NextResponse } from "next/server";

function apiOrigin(): string {
  const base = process.env.BACKEND_URL;
  if (!base?.trim()) throw new Error("BACKEND_URL is not set");
  return base.replace(/\/+$/, "");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const version = new URL(req.url).searchParams.get("version") ?? "1";
  const res = await fetch(
    `${apiOrigin()}/battle-audio/${encodeURIComponent(token)}/audio?version=${version}`,
  );
  if (!res.ok) {
    return NextResponse.json({ error: "not found" }, { status: res.status });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
