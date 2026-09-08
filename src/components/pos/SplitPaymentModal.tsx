import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, Banknote, QrCode, CreditCard } from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { SplitPaymentDetails } from '../../types';

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  hasRoomSelected?: boolean;
  onConfirmSplit: (splitDetails: SplitPaymentDetails) => void;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirmSplit,
}) => {
  const { settings } = useBilling();
  const [cash, setCash] = useState<number>(0);
  const [upi, setUpi] = useState<number>(0);
  const [card, setCard] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const half = Math.floor(totalAmount / 2);
      setCash(half);
      setUpi(totalAmount - half);
      setCard(0);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const currentTotal = cash + upi + card;
  const difference = totalAmount - currentTotal;
  const isBalanced = Math.abs(difference) === 0;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    onConfirmSplit({
      cash,
      upi,
      card,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Split Payment</h2>
              <p className="text-xs text-slate-500">Distribute bill across Cash, UPI and Card</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-base">✕</button>
        </div>

        {/* Bill Total Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-500 font-medium">Bill Total Amount</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {settings.currencySymbol}{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 font-medium">
              {difference === 0 ? 'Status' : difference > 0 ? 'Remaining' : 'Excess'}
            </div>
            <div
              className={`text-base font-bold mt-0.5 ${
                isBalanced
                  ? 'text-emerald-600'
                  : difference > 0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {isBalanced ? '✓ Balanced' : `${settings.currencySymbol}${Math.abs(difference)}`}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <form onSubmit={handleConfirm} className="space-y-3 text-xs">
          {/* Cash */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Cash Amount
              </label>
              {difference > 0 && (
                <button
                  type="button"
                  onClick={() => setCash(prev => prev + difference)}
                  className="text-[11px] text-emerald-600 hover:underline font-bold"
                >
                  + Add Remaining
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={cash || ''}
              onChange={e => setCash(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* UPI */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-600" />
                UPI Amount
              </label>
              {difference > 0 && (
                <button
                  type="button"
                  onClick={() => setUpi(prev => prev + difference)}
                  className="text-[11px] text-teal-600 hover:underline font-bold"
                >
                  + Add Remaining
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={upi || ''}
              onChange={e => setUpi(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Card */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-600" />
                Card Amount
              </label>
              {difference > 0 && (
                <button
                  type="button"
                  onClick={() => setCard(prev => prev + difference)}
                  className="text-[11px] text-sky-600 hover:underline font-bold"
                >
                  + Add Remaining
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={card || ''}
              onChange={e => setCard(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Settle Split Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
