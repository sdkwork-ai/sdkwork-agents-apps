import { useCallback, useEffect, useMemo, useState } from "react";
import {
  File as FileIcon,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
} from "lucide-react";

import {
  MobileResourceList,
  cn,
  formatFileSize,
  formatListTimestamp,
  resolveFileKind,
  type FileKind,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsLibraryText } from "../i18n";
import { LIBRARY_SEARCH_DEBOUNCE_MS } from "../libraryConstants";
import { LibraryService } from "../services/LibraryService";
import { isLibraryPortConfigured } from "../services/libraryPort";
import type { LibraryFile } from "../types";

const ICON_BY_KIND: Record<FileKind, typeof FileIcon> = {
  image: ImageIcon,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: FileArchive,
  code: FileCode,
  other: FileIcon,
};

export interface LibraryScreenProps {
  /** Opens a resolved preview URL. Defaults to `window.open`. */
  onOpenFile?: (url: string, file: LibraryFile) => void;
  className?: string;
}

/**
 * Library surface behind the `library` tab.
 *
 * Lists the Drive-backed file library the Agents chat reuses, with a
 * client-side name filter. The file set is owned by the Drive service; this
 * screen never mutates it.
 */
export function LibraryScreen({ onOpenFile, className }: LibraryScreenProps) {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLibraryPortConfigured()) {
      setLoading(false);
      setError(translateAgentsLibraryText("agents.library.loadFailed"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const listing = await LibraryService.listFiles();
      setFiles(listing.items);
      setTruncated(listing.truncated);
    } catch {
      setError(translateAgentsLibraryText("agents.library.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), LIBRARY_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = useMemo(
    () => LibraryService.filterByName(files, debouncedQuery),
    [debouncedQuery, files],
  );

  const handleOpen = useCallback(
    async (file: LibraryFile) => {
      setOpeningId(file.id);
      try {
        const url = await LibraryService.resolvePreviewUrl(file.id);
        if (onOpenFile) {
          onOpenFile(url, file);
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } catch {
        setError(translateAgentsLibraryText("agents.library.openFailed"));
      } finally {
        setOpeningId(null);
      }
    },
    [onOpenFile],
  );

  return (
    <MobileResourceList
      {...(className ? { className } : {})}
      title={translateAgentsLibraryText("agents.library.title")}
      searchPlaceholder={translateAgentsLibraryText("agents.library.search.placeholder")}
      searchValue={query}
      onSearchChange={setQuery}
      items={visible}
      keyOf={(file) => file.id}
      loading={loading}
      loadingText={translateAgentsLibraryText("agents.library.loading")}
      errorText={error}
      onRetry={() => void load()}
      emptyText={translateAgentsLibraryText("agents.library.empty")}
      notice={
        truncated ? translateAgentsLibraryText("agents.library.truncated") : null
      }
      renderRow={(file) => {
        const Icon = ICON_BY_KIND[resolveFileKind(file.name, file.mimeType)];
        return (
          <button
            type="button"
            disabled={openingId === file.id}
            onClick={() => void handleOpen(file)}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition",
              "active:bg-[var(--color-hover-bg,rgba(0,0,0,0.03))]",
              "disabled:opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-[var(--color-surface-color,#ffffff)]",
                "border border-[var(--color-border-color,rgba(0,0,0,0.05))]",
              )}
            >
              <Icon
                size={18}
                aria-hidden="true"
                className="text-[var(--color-primary-blue,#2b5ce7)]"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-[var(--color-text-main,#1f1f1f)]">
                {file.name}
              </span>
              <span className="block text-[11px] text-[var(--color-text-sub,#8c8c8c)]">
                {[formatListTimestamp(file.updatedAt), formatFileSize(file.sizeBytes)]
                  .filter((part) => part && part !== "-")
                  .join(" · ")}
              </span>
            </span>
          </button>
        );
      }}
    />
  );
}
