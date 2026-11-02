import React from 'react';
import { X, Save } from 'lucide-react';
import { useAgentState } from '../contexts/AgentStateContext';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ isOpen, onClose }) => {
  const {
  agentName, setAgentName,
  systemPrompt, setSystemPrompt,
  activeModel, setActiveModel
  } = useAgentState();

  const [localName, setLocalName] = React.useState(agentName);
  const [localPrompt, setLocalPrompt] = React.useState(systemPrompt);
  const [localModel, setLocalModel] = React.useState(activeModel);

  React.useEffect(() => {
    if (isOpen) {
      setLocalName(agentName);
      setLocalPrompt(systemPrompt);
      setLocalModel(activeModel);
    }
  }, [isOpen, agentName, systemPrompt, activeModel]);

  if (!isOpen) return null;

  const handleSave = () => {
    setAgentName(localName);
    setSystemPrompt(localPrompt);
    setActiveModel(localModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ag-color-scrim)]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--ag-color-surface,#FFFFFF)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--ag-color-text-primary,#0A1B3D)]">Agent Configuration</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ag-color-icon-default,#5B6B88)] transition-colors hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--ag-color-text-secondary,#5B6B88)]">
              Display Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-lg text-sm text-[var(--ag-color-text-primary,#0A1B3D)] focus:outline-none"
              placeholder="e.g. GPT-4o Assistant"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--ag-color-text-secondary,#5B6B88)]">
              Active Model
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-lg text-sm text-[var(--ag-color-text-primary,#0A1B3D)] focus:outline-none"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--ag-color-text-secondary,#5B6B88)]">
              System Prompt
            </label>
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-lg text-sm text-[var(--ag-color-text-primary,#0A1B3D)] focus:outline-none resize-none"
              placeholder="Enter system instructions..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-[var(--ag-color-background,#F4F7FC)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--ag-color-text-secondary,#5B6B88)] hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ag-color-icon-on-primary,#FFFFFF)] bg-[var(--ag-color-primary,#165DFF)] hover:bg-[var(--ag-color-primary-hover,#4080FF)] active:bg-[var(--ag-color-primary-pressed,#0E42D2)] rounded-lg transition-colors"
          >
            <Save size={16} />
              Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
