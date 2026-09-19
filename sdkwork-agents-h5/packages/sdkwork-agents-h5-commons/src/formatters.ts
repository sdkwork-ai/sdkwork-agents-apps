/**
 * Domain-neutral formatters shared by the Agents mobile capability packages.
 *
 * Formatting is presentation-only and must not encode business rules, so it
 * lives in `commons` instead of being copied into each capability package.
 */

/** Coarse file category used to pick a list glyph. */
export type FileKind = "image" | "document" | "spreadsheet" | "presentation" | "archive" | "code" | "other";

const FILE_KIND_BY_EXTENSION: Record<string, FileKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  pdf: "document",
  doc: "document",
  docx: "document",
  txt: "document",
  md: "document",
  markdown: "document",
  csv: "spreadsheet",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  ppt: "presentation",
  pptx: "presentation",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  rar: "archive",
  html: "code",
  htm: "code",
  js: "code",
  ts: "code",
  json: "code",
};

/** Resolves a list glyph category from a file name and optional mime type. */
export function resolveFileKind(name: string, mimeType?: string): FileKind {
  if (mimeType?.startsWith("image/")) {
    return "image";
  }
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_KIND_BY_EXTENSION[extension] ?? "other";
}

/** Formats a byte count string into a compact human-readable size. */
export function formatFileSize(bytes?: string | number): string {
  if (bytes === undefined || bytes === null) {
    return "-";
  }
  const value = typeof bytes === "number" ? bytes : Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Formats an ISO timestamp or epoch value for list rows: same-day values render
 * as `HH:mm`, otherwise as `MM/DD HH:mm`.
 */
export function formatListTimestamp(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hhmm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return sameDay ? hhmm : `${date.getMonth() + 1}/${date.getDate()} ${hhmm}`;
}

/** Parses an ISO timestamp, returning `0` for unusable input. */
export function parseTimestamp(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
