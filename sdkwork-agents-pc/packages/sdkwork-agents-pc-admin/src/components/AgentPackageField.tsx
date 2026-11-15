import { useRef, useState } from 'react';

import {
  LOCAL_AGENT_ENGINES,
  buildLocalArchiveDistribution,
  type AgentArchiveDistribution,
  type AgentKind,
} from '@sdkwork/agents-pc-core/domain/agentRuntimeCatalog';
import { agentsDriveUploadService } from '@sdkwork/agents-pc-core/sdk/driveUploadService';

import { useAgentAdminCopy } from '../agentAdminCopy';

const MEBIBYTE = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 512 * MEBIBYTE;
const SECONDARY_BUTTON_CLASS =
  'rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700/60 disabled:opacity-60';
const FIELD_CLASS =
  'w-full rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';

function formatBytes(value: string | undefined): string | null {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return bytes >= MEBIBYTE
    ? `${(bytes / MEBIBYTE).toFixed(1)} MiB`
    : `${Math.max(1, Math.round(bytes / 1024))} KiB`;
}

async function sha256Hex(file: File): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

export interface AgentPackageFieldProps {
  agentKind: AgentKind;
  engineId: string;
  distribution: AgentArchiveDistribution | null;
  /** Stable resource id used for the Drive upload declaration. */
  agentId: string;
  disabled?: boolean;
  onAgentKindChange: (kind: AgentKind) => void;
  onEngineChange: (engineId: string) => void;
  onDistributionChange: (distribution: AgentArchiveDistribution | null) => void;
}

/**
 * Agent package/distribution editor for local-execution agents.
 *
 * Agents are distributed as a zip archive, unlike Skill/Plugin packages. The
 * section exposes the choice between a hosted conversation agent and a locally
 * installed agent, the Harness engine, and the archive upload that records the
 * Drive locator plus SHA-256 checksum in `manifest.distribution`.
 */
export function AgentPackageField({
  agentKind,
  engineId,
  distribution,
  agentId,
  disabled = false,
  onAgentKindChange,
  onEngineChange,
  onDistributionChange,
}: AgentPackageFieldProps) {
  const copy = useAgentAdminCopy();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLocal = agentKind === 'local-execution';
  const sizeLabel = formatBytes(distribution?.sizeBytes);
  const packageLabel = distribution?.fileName ?? distribution?.archiveRef ?? copy.package.noPackage;

  function changeKind(next: AgentKind) {
    setError(null);
    onAgentKindChange(next);
    if (next === 'conversation') {
      onDistributionChange(null);
      return;
    }
    if (!distribution) {
      onDistributionChange(buildLocalArchiveDistribution(engineId));
    }
  }

  function changeEngine(nextEngineId: string) {
    setError(null);
    onEngineChange(nextEngineId);
    // The archive identity and entrypoint belong to the engine. Keep the
    // catalog descriptor but drop the previous upload so stale bytes cannot be
    // installed under the wrong engine.
    onDistributionChange(buildLocalArchiveDistribution(nextEngineId));
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function pick(next: File | undefined) {
    if (!next) return;
    if (!/\.zip$/iu.test(next.name)) {
      setError(copy.package.missing);
      setFile(null);
      return;
    }
    if (next.size <= 0 || next.size > MAX_ARCHIVE_BYTES) {
      setError(copy.package.missing);
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  }

  async function upload() {
    if (!file) {
      setError(copy.package.missing);
      return;
    }
    if (!agentId.trim()) {
      setError(copy.package.missing);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const media = await agentsDriveUploadService.upload({
        file,
        purpose: 'agent-package',
        resourceId: agentId.trim(),
      });
      const checksum = await sha256Hex(file);
      const base = buildLocalArchiveDistribution(engineId);
      onDistributionChange({
        ...base,
        driveUri: media.uri,
        fileName: media.fileName,
        sizeBytes: media.sizeBytes,
        checksum,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setUploading(false);
    }
  }

  const busy = disabled || uploading;

  return (
    <fieldset className="grid gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
        {copy.package.legend}
      </legend>
      <p className="text-xs text-zinc-500">{copy.package.hint}</p>
      <label className="grid gap-1.5 text-sm">
        <span className="text-xs font-medium text-zinc-400">{copy.package.kind}</span>
        <select
          className={FIELD_CLASS}
          value={agentKind}
          onChange={(event) => changeKind(event.target.value as AgentKind)}
          disabled={busy}
        >
          <option value="conversation">{copy.package.kinds.conversation}</option>
          <option value="local-execution">{copy.package.kinds.localExecution}</option>
        </select>
      </label>

      {isLocal ? (
        <>
          <label className="grid gap-1.5 text-sm">
            <span className="text-xs font-medium text-zinc-400">{copy.package.engine}</span>
            <select
              className={FIELD_CLASS}
              value={engineId}
              onChange={(event) => changeEngine(event.target.value)}
              disabled={busy}
            >
              {LOCAL_AGENT_ENGINES.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-md border border-zinc-700/70 bg-zinc-800/40 p-2.5 text-xs text-zinc-300">
            <div className="font-medium text-zinc-200">{copy.package.current}</div>
            <div className="mt-1 break-all">
              {packageLabel}
              {sizeLabel ? ` · ${sizeLabel}` : ''}
              {distribution?.driveUri
                ? ` · ${copy.package.uploadedBadge}`
                : ` · ${copy.package.notUploaded}`}
            </div>
            {distribution?.checksum ? (
              <div className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                {copy.package.checksum(distribution.checksum)}
              </div>
            ) : null}
            {distribution?.driveUri ? (
              <div className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                {distribution.driveUri}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-1.5 file:text-sm file:text-zinc-200 hover:file:bg-zinc-600"
              disabled={busy}
              onChange={(event) => pick(event.target.files?.[0])}
              aria-label={copy.package.choose}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={upload}
                disabled={busy || !file}
              >
                {uploading ? copy.package.uploading : copy.package.upload}
              </button>
              {file ? (
                <span className="text-xs text-zinc-400">{file.name}</span>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
