import type { CreativeCatalog, CreativeRun } from "../types";
import {
  getCreativePort,
  isCreativePortConfigured,
  type CreativeGenerateInput,
} from "./creativePort";

/** Device-local run log ceiling; the studio is a working surface, not an archive. */
export const CREATIVE_MAX_RUNS = 20;

const CREATIVE_RUNS_KEY = "sdkwork.agents.h5.creative.runs.v1";

function readStoredRuns(): CreativeRun[] {
  try {
    const raw = globalThis.localStorage?.getItem(CREATIVE_RUNS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CreativeRun[]) : [];
  } catch {
    return [];
  }
}

function writeStoredRuns(runs: readonly CreativeRun[]): void {
  try {
    globalThis.localStorage?.setItem(
      CREATIVE_RUNS_KEY,
      JSON.stringify(runs.slice(0, CREATIVE_MAX_RUNS)),
    );
  } catch {
    // A full or unavailable device store must not fail a completed request.
  }
}

export class CreativeService {
  static async loadCatalog(): Promise<CreativeCatalog> {
    if (!isCreativePortConfigured()) {
      return { availability: "unavailable", tools: [], reason: "transport-not-composed" };
    }
    const tools = await getCreativePort().loadTools();
    if (tools.length === 0) {
      return { availability: "unavailable", tools, reason: "no-generation-tool" };
    }
    return { availability: "available", tools };
  }

  static listRuns(): CreativeRun[] {
    return readStoredRuns();
  }

  static clearRuns(): void {
    writeStoredRuns([]);
  }

  static async generate(input: CreativeGenerateInput): Promise<CreativeRun> {
    const text = input.prompt.trim();
    if (text.length === 0) {
      throw new Error("A prompt is required to generate content.");
    }
    const run = await getCreativePort().generate({ ...input, prompt: text });
    writeStoredRuns([run, ...readStoredRuns()]);
    return run;
  }
}
