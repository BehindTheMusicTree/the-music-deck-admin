"use server";

function apiOrigin(): string {
  const base = process.env.BACKEND_URL;
  if (!base?.trim()) throw new Error("BACKEND_URL is not set");
  return base.replace(/\/+$/, "");
}

export async function uploadBattleMusic(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const token = formData.get("token");
  const versionRaw = formData.get("version");
  const file = formData.get("file");

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, message: "Token is required" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an audio file" };
  }
  const version = versionRaw != null ? Number(versionRaw) : 1;
  if (!Number.isFinite(version) || version < 1) {
    return { ok: false, message: "Version must be a positive integer" };
  }

  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return { ok: false, message: "ADMIN_API_TOKEN is not configured" };
  }

  const upstream = new FormData();
  upstream.append("file", file);

  const res = await fetch(
    `${apiOrigin()}/battle-music/${encodeURIComponent(token.trim())}?version=${version}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: upstream,
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, message: text.slice(0, 500) };
  }

  return { ok: true, message: `Uploaded ${token.trim()} v${version}` };
}

export async function deleteBattleMusic(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const token = formData.get("token");
  const versionRaw = formData.get("version");

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, message: "Token is required" };
  }
  const version = versionRaw != null ? Number(versionRaw) : 1;

  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return { ok: false, message: "ADMIN_API_TOKEN is not configured" };
  }

  const res = await fetch(
    `${apiOrigin()}/battle-music/${encodeURIComponent(token.trim())}?version=${version}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, message: text.slice(0, 500) };
  }

  return { ok: true, message: `Deleted ${token.trim()} v${version}` };
}
