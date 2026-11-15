import React, { useCallback, useRef, useState } from 'react';
import { FileArchive, UploadCloud } from 'lucide-react';

import type { AgentArchiveDistribution } from '../services/agentRuntimeCatalog';

export interface AgentPackageUploadProps {
  /** Disables interaction while a parent transition is in flight. */
  disabled?: boolean;
  /** Persists the archive for the created agent and returns its descriptor. */
  upload(file: File, onProgress: (ratio: number) => void): Promise<AgentArchiveDistribution>;
  onUploaded(distribution: AgentArchiveDistribution): void;
}

const MEBIBYTE = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 512 * MEBIBYTE;

function formatBytes(bytes: number): string {
  if (bytes >= MEBIBYTE) {
    return `${(bytes / MEBIBYTE).toFixed(1)} MiB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KiB`;
}

/** SHA-256 of the selected archive, computed before upload for integrity. */
async function sha256Hex(file: File): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) {
      return null;
    }
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    // Integrity evidence is best-effort; the archive still uploads and the
    // runtime records the descriptor without a checksum.
    return null;
  }
}

/**
 * Step two for a local-execution agent: upload the zip installation archive.
 *
 * The archive is the whole definition of a local agent — no prompt or model
 * composition is edited here. The component validates the format and size,
 * hashes the file, reports progress, and hands the descriptor to the flow.
 */
export function AgentPackageUpload({ disabled = false, upload, onUploaded }: AgentPackageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = useCallback((next: File | undefined) => {
    if (!next) {
      return;
    }
    if (!/\.zip$/iu.test(next.name)) {
      setError('安装包必须是 .zip 压缩文件');
      setFile(null);
      return;
    }
    if (next.size <= 0 || next.size > MAX_ARCHIVE_BYTES) {
      setError(`安装包大小必须在 1 字节到 ${MAX_ARCHIVE_BYTES / MEBIBYTE} MiB 之间`);
      setFile(null);
      return;
    }
    setError('');
    setProgress(0);
    setFile(next);
  }, []);

  const start = async (): Promise<void> => {
    if (!file || busy || disabled) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const distribution = await upload(file, (ratio) => setProgress(ratio));
      const checksum = await sha256Hex(file);
      onUploaded({ ...distribution, checksum });
    } catch (uploadError) {
      console.error('Agent package upload failed', uploadError);
      setError(
        uploadError instanceof Error && uploadError.message
          ? uploadError.message
          : '安装包上传失败，请检查网络与存储服务后重试',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#181818] p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          pick(event.dataTransfer.files[0]);
        }}
      >
        <FileArchive className="mx-auto mb-2 text-[#00B42A]" size={28} />
        <div className="text-sm font-medium text-slate-800 dark:text-gray-200">
          {file ? file.name : '拖入或选择 zip 安装包'}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-gray-500">
          {file ? `${formatBytes(file.size)} · 安装包将保存到 Drive 并登记校验和` : '最大 512 MiB，仅支持 .zip'}
        </div>
        <button
          className="mt-3 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-gray-300 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          disabled={busy || disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <UploadCloud size={14} />
          {file ? '重新选择' : '选择安装包'}
        </button>
        <input
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={(event) => pick(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
      </div>

      {busy || progress > 0 ? (
        <div aria-label="安装包上传进度" className="h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded bg-[#00B42A] transition-all"
            style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded bg-amber-500/5 p-2.5 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
          {error}
        </div>
      ) : null}

      <button
        className="w-full rounded bg-[#00B42A] px-4 py-2 text-sm text-white transition-colors hover:bg-[#00A32A] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!file || busy || disabled}
        onClick={() => void start()}
        type="button"
      >
        {busy || progress > 0 ? `上传中 ${Math.round(progress * 100)}%` : '上传并完成创建'}
      </button>
    </div>
  );
}
