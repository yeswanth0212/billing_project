import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, CheckCircle2, Copy, Check } from 'lucide-react';
import { useBilling } from '../../context/BillingContext';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  billNumber?: string;
  onConfirmPayment: (upiTxnRef: string) => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  amount,
  billNumber = 'BILL',
  onConfirmPayment,
}) => {
  const { settings } = useBilling();
  const [txnRef, setTxnRef] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upiVpa = settings.upiId || 'hotelbilling@icici';
  const payeeName = settings.upiPayeeName || settings.hotelName || 'Hotel Billing';
  const note = `Payment for ${billNumber}`;
  
  const upiString = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment(txnRef.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-bold mb-2">
            <QrCode className="w-3.5 h-3.5" />
            Dynamic UPI QR Payment
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Scan & Pay Any UPI App</h2>
          <p className="text-xs text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, BHIM, Cred</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mx-auto border-2 border-teal-100">
          <QRCodeSVG
            value={upiString}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Amount Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="text-xs text-slate-500 font-medium">Exact Payable Amount</div>
          <div className="text-3xl font-black text-teal-700 font-mono tracking-tight mt-0.5">
            {settings.currencySymbol}{amount.toLocaleString('en-IN')}
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
            <span>UPI ID: <strong className="text-slate-900 font-mono">{upiVpa}</strong></span>
            <button
              onClick={handleCopyVpa}
              className="text-teal-600 hover:text-teal-700 p-0.5"
              title="Copy UPI VPA"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirmation Form */}
        <form onSubmit={handleConfirm} className="space-y-3 text-left text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              UPI Reference / UTR Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 423589123456"
              value={txnRef}
              onChange={e => setTxnRef(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Paid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
