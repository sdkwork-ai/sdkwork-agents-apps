import { useEffect, useState } from 'react';

import {
  loadAgentLlmModels,
  type AgentLlmModel,
} from '../creative-model-catalog/agentLlmModels';

export interface AgentLlmModelsState {
  models: AgentLlmModel[];
  loading: boolean;
}

/**
 * Load the language models the agent composer can select.
 *
 * @param enabled - skip the request outside agent mode.
 * @returns the cached options and loading state.
 */
export function useAgentLlmModels(enabled: boolean): AgentLlmModelsState {
  const [models, setModels] = useState<AgentLlmModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    void loadAgentLlmModels()
      .then((next) => {
        if (!cancelled) setModels(next);
      })
      .catch((error) => {
        console.error('Agent LLM model catalog load failed', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { models, loading };
}
