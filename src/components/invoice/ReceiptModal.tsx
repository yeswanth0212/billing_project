import React, { useState, useEffect } from 'react';
import { Printer, Download, X, FileText, CheckCircle2, MessageSquare, Share2 } from 'lucide-react';
import { useBilling, ReceiptPrintFormat } from '../../context/BillingContext';
import { ThermalReceipt } from './ThermalReceipt';
import { A4Invoice } from './A4Invoice';
import { KotReceipt } from './KotReceipt';
import { exportInvoicePDF } from '../../utils/pdfExport';

export const ReceiptModal: React.FC = () => {
  const { 
    activeReceiptBill, 
    activeKotReceipt, 
    receiptFormat, 
    setReceiptFormat, 
    closeReceiptModal, 
    settings,
    sendWhatsAppBill,
    shareBill,
  } = useBilling();

  const [whatsAppPhone, setWhatsAppPhone] = useState('');

  useEffect(() => {
    if (activeReceiptBill?.customerPhone) {
      setWhatsAppPhone(activeReceiptBill.customerPhone);
    } else {
      setWhatsAppPhone('');
    }
  }, [activeReceiptBill]);

  if (!activeReceiptBill && !activeKotReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (activeReceiptBill) {
      exportInvoicePDF(activeReceiptBill, settings);
    }
  };

  const handleSendWhatsApp = () => {
    if (activeReceiptBill) {
      sendWhatsAppBill(activeReceiptBill, whatsAppPhone);
    }
  };

  const handleShareNative = async () => {
    if (activeReceiptBill) {
      await shareBill(activeReceiptBill);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-teal-600" />
              {activeKotReceipt && !activeReceiptBill
                ? 'Kitchen Order Ticket (KOT)'
                : 'Invoice & Receipt Preview'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {activeReceiptBill ? `Invoice #${activeReceiptBill.billNumber}` : `KOT #${activeKotReceipt?.kotNumber}`}
            </p>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {activeReceiptBill && (
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px]">
                <button
                  onClick={() => setReceiptFormat('80mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    receiptFormat === '80mm' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm Roll
                </button>
                <button
                  onClick={() => setReceiptFormat('58mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    receiptFormat === '58mm' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58mm Roll
                </button>
                <button
                  onClick={() => setReceiptFormat('a4')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    receiptFormat === 'a4' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Tax
                </button>
                <button
                  onClick={() => setReceiptFormat('a5')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    receiptFormat === 'a5' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A5
                </button>
              </div>
            )}

            <button
              onClick={closeReceiptModal}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex justify-center shadow-inner">
          {activeKotReceipt && receiptFormat === 'kot' ? (
            <KotReceipt kot={activeKotReceipt} />
          ) : activeReceiptBill ? (
            receiptFormat === 'a4' ? (
              <A4Invoice bill={activeReceiptBill} settings={settings} size="a4" />
            ) : receiptFormat === 'a5' ? (
              <A4Invoice bill={activeReceiptBill} settings={settings} size="a5" />
            ) : (
              <ThermalReceipt
                bill={activeReceiptBill}
                settings={settings}
                paperWidth={receiptFormat === '58mm' ? '58mm' : '80mm'}
              />
            )
          ) : null}
        </div>

        {/* WhatsApp & Quick Share Section */}
        {activeReceiptBill && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-emerald-950">WhatsApp Bill Delivery</span>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">Instant</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="tel"
                    placeholder="Customer WhatsApp (10 digits)"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 w-full max-w-[200px]"
                  />
                  {whatsAppPhone && (
                    <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline">
                      Direct to WhatsApp
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleShareNative}
                  title="Share via Mobile"
                  className="p-2 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-1">
          {activeReceiptBill && (
            <button
              onClick={handleDownloadPDF}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>Download PDF</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print {receiptFormat.toUpperCase()} Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
