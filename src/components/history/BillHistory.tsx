import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Printer, 
  FileText, 
  Download, 
  XCircle, 
  RotateCcw, 
  FileSpreadsheet,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { useAuth } from '../../context/AuthContext';
import { Bill, PaymentMethod, BillStatus } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { exportInvoicePDF } from '../../utils/pdfExport';
import { exportBillsToExcel, exportBillsToCSV } from '../../utils/excelExport';

export const BillHistory: React.FC = () => {
  const { bills, previewBill, cancelBill, refundBill, settings, showToast, sendWhatsAppBill } = useBilling();
  const { hasRole } = useAuth();
  const canVoid = hasRole(['admin', 'manager']);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BillStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Cancel / Refund Modal
  const [activeModalAction, setActiveModalAction] = useState<'cancel' | 'refund' | null>(null);
  const [selectedBillForAction, setSelectedBillForAction] = useState<Bill | null>(null);
  const [actionReason, setActionReason] = useState('');

  const filtered = bills.filter(b => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.customerName && b.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (b.customerPhone && b.customerPhone.includes(search));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || b.paymentMethod === paymentFilter;
    const matchesDate = !dateFilter || b.createdAt.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForAction || !actionReason.trim()) {
      showToast('Reason is strictly required for this audit record', 'error');
      return;
    }

    if (activeModalAction === 'cancel') {
      await cancelBill(selectedBillForAction.id, actionReason.trim());
    } else if (activeModalAction === 'refund') {
      await refundBill(selectedBillForAction.id, actionReason.trim());
    }

    setActiveModalAction(null);
    setSelectedBillForAction(null);
    setActionReason('');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Invoices & Bill History
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Search invoices, reprint 58mm/80mm receipts, download A4 tax bills, and process cancellations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportBillsToExcel(filtered, `Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => exportBillsToCSV(filtered, `Invoices_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bill #, guest name, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="split">Split</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Reprint & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map(bill => {
                  const isPaid = bill.status === 'paid';
                  const isCancelled = bill.status === 'cancelled';
                  const isRefunded = bill.status === 'refunded';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">
                        {bill.billNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {formatDateTime(bill.createdAt)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{bill.customerName || 'Walk-in'}</div>
                        {bill.customerPhone && (
                          <div className="text-[10px] text-slate-500 font-mono">{bill.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-700">
                          {bill.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        {settings.currencySymbol}{bill.grandTotal}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => previewBill(bill, '80mm')}
                            title="Thermal Print"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-teal-700 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => previewBill(bill, 'a4')}
                            title="View A4 Tax Invoice"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sky-700 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => exportInvoicePDF(bill, settings)}
                            title="Download PDF"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => sendWhatsAppBill(bill)}
                            title="Send invoice to WhatsApp"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {canVoid && isPaid && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedBillForAction(bill);
                                  setActiveModalAction('cancel');
                                  setActionReason('');
                                }}
                                title="Void / Cancel Bill"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBillForAction(bill);
                                  setActiveModalAction('refund');
                                  setActionReason('');
                                }}
                                title="Process Refund"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation / Refund Modal */}
      {activeModalAction && selectedBillForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold border-b border-slate-100 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <span>
                {activeModalAction === 'cancel' ? 'Cancel Bill' : 'Refund Bill'} #{selectedBillForAction.billNumber}
              </span>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Amount: <strong className="text-slate-900 font-mono">{settings.currencySymbol}{selectedBillForAction.grandTotal}</strong>
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason (Mandatory for Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Customer returned items, entered wrong amount..."
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalAction(null);
                    setSelectedBillForAction(null);
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!actionReason.trim()}
                  className={`px-5 py-2 rounded-2xl text-white font-bold disabled:opacity-40 shadow-xs ${
                    activeModalAction === 'cancel'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-amber-500 hover:bg-amber-400'
                  }`}
                >
                  Confirm {activeModalAction === 'cancel' ? 'Cancellation' : 'Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
