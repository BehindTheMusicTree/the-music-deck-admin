import { CARD_ARTWORK_PROMPTS } from "./artwork-prompts";
export { ARTWORK_CREATED_AT } from "./artwork-created-at";
export { CARD_ARTWORK_BASE as ART } from "./card-artworks-base";

export function artworkPromptFor(
  id: number,
): { artworkPrompt: string } | undefined {
  const s = CARD_ARTWORK_PROMPTS[id];
  return s ? { artworkPrompt: s } : undefined;
}
