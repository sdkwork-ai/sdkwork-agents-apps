import React, { useEffect, useRef } from 'react';
import { X, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { useAgentState } from '../contexts/AgentStateContext';
import { cn } from '@sdkwork/agents-pc-commons';

interface AgentHistoryLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentHistoryLog: React.FC<AgentHistoryLogProps> = ({ isOpen, onClose }) => {
  const { events, clearEvents } = useAgentState();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isOpen]);

  if (!isOpen) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} className="text-[var(--ag-color-success,#00B42A)]" />;
      case 'warning': return <AlertTriangle size={14} className="text-[var(--ag-color-warning,#FF7D00)]" />;
      case 'error': return <AlertCircle size={14} className="text-[var(--ag-color-danger,#F53F3F)]" />;
      case 'info':
      default:
      return <Info size={14} className="text-[var(--ag-color-icon-active,#165DFF)]" />;
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed top-16 right-4 z-40 w-80 max-h-[400px] flex flex-col bg-[var(--ag-color-surface,#FFFFFF)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex justify-between items-center px-4 py-3 bg-[var(--ag-color-surface-muted,#EAF1FB)]">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
          <h3 className="text-sm font-semibold text-[var(--ag-color-text-primary,#0A1B3D)]">Agent History</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearEvents}
            className="p-1.5 rounded-lg text-[var(--ag-color-icon-default,#5B6B88)] transition-colors hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)]"
            title="Clear Log"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ag-color-icon-default,#5B6B88)] transition-colors hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)]"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
      >
        {events.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--ag-color-text-tertiary,#8A97AD)]">
                No events recorded yet.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] transition-colors group"
                >
                  <div className="pt-0.5 shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs leading-relaxed break-words",
                      event.type === 'error' ? "text-[var(--ag-color-danger,#F53F3F)]" :
                        event.type === 'warning' ? "text-[var(--ag-color-warning,#FF7D00)]" :
                          "text-[var(--ag-color-text-secondary,#5B6B88)]"
                    )}>
                      {event.message}
                    </p>
                    <div className="text-[10px] text-[var(--ag-color-text-tertiary,#8A97AD)] mt-0.5">
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                </div>
              ))
        )}
      </div>
    </div>
  );
};
