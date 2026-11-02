import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
  width?: string;
  footer?: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, title, children, height, width = 'w-[400px]', footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-scrim,rgba(10,27,61,0.45))]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
            className={`bg-[var(--color-surface-color,#FFFFFF)] rounded-xl overflow-hidden flex flex-col ${width} ${height ?? 'max-h-[80vh]'} max-w-[calc(100vw-32px)] max-h-[calc(100vh-40px)]`}
          >
            <div className="flex items-center justify-between px-5 py-4 shrink-0">
              <h3 className="text-[var(--color-text-primary,#0A1B3D)] font-medium">{title}</h3>
              <button onClick={onClose} className="text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5">
              {children}
            </div>
            {footer && (
              <div className="px-5 py-4 bg-[var(--color-surface-muted,#EAF1FB)] shrink-0 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
