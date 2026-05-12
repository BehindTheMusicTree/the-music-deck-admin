"use client";

import { useActionState } from "react";
import { uploadBattleAudio } from "@/app/admin/battles/actions";

const initial = { ok: false, message: "" };

export function BattleAudioUploadForm() {
  const [state, formAction, pending] = useActionState(uploadBattleAudio, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="font-garamond text-sm text-muted block mb-1">
          Token
        </label>
        <input
          type="text"
          name="token"
          required
          placeholder="genre-rock--intensity-experimental"
          className="w-full rounded border border-ui-border bg-[#0f0f14] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60"
        />
        <p className="font-mono text-[11px] text-muted mt-1">
          e.g. genre-disco-funk--intensity-pop · country-france
        </p>
      </div>

      <div>
        <label className="font-garamond text-sm text-muted block mb-1">
          Version
        </label>
        <input
          type="number"
          name="version"
          defaultValue={1}
          min={1}
          step={1}
          required
          className="w-32 rounded border border-ui-border bg-[#0f0f14] px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/60"
        />
      </div>

      <div>
        <label className="font-garamond text-sm text-muted block mb-1">
          Audio file (MP3)
        </label>
        <input
          type="file"
          name="file"
          accept="audio/*"
          required
          className="block w-full text-sm text-white/90"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gold/40 bg-[#1a1a22] px-4 py-2 text-sm text-gold hover:bg-gold/10 disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload to S3"}
      </button>

      {state.message ? (
        <p
          className={
            state.ok
              ? "text-green-400 text-sm"
              : "text-red-400 text-sm wrap-break-word"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
