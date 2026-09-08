import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', description: 'Clear active cart & start fresh bill' },
    { key: 'F2', description: 'Open Settle & Payment modal' },
    { key: 'F4', description: 'Open Table Selection floor map' },
    { key: 'F7', description: 'Print Kitchen Order Ticket (KOT)' },
    { key: 'Ctrl + P', description: 'Trigger Thermal Printer receipt' },
    { key: 'Esc', description: 'Close any open modal / popup' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            POS Terminal Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold shadow">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
