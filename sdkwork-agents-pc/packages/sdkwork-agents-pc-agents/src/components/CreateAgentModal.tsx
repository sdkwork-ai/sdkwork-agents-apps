import React from 'react';

import { AgentCreationFlow } from '../editor/AgentCreationFlow';

/**
 * Compatibility wrapper for hosts that only mount the basic creation dialog.
 *
 * The whole flow lives in `AgentCreationFlow`: basic information first, then a
 * zip upload for local agents or the host's editor page for conversation
 * agents. `onSuccess` receives the created agent id in both cases, which is the
 * one thing callers ever needed from this dialog.
 */
export const CreateAgentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agentId?: string) => void;
}> = ({ isOpen, onClose, onSuccess }) => (
  <AgentCreationFlow
    onClose={onClose}
    onCompleted={(agent) => onSuccess(agent.id)}
    onContinueToEditor={(agent) => onSuccess(agent.id)}
    open={isOpen}
  />
);
