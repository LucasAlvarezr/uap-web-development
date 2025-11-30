
import sanitizeHtml from "sanitize-html";

const MAX_LEN = 4000;

export function sanitizeUserText(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().slice(0, MAX_LEN);
  return sanitizeHtml(trimmed, { allowedTags: [], allowedAttributes: {} });
}

export function isEmptyMessage(text: string) {
  return !text || text.replace(/\s+/g, "").length === 0;
}
