import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Clock, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Layers, 
  FileSpreadsheet,
  Award,
  AlertCircle
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { exportBillsToExcel } from '../../utils/excelExport';
import { exportSalesReportPDF } from '../../utils/pdfExport';

export const ReportsDashboard: React.FC = () => {
  const { bills, settings } = useBilling();

  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredBills = bills.filter(bill => {
    if (bill.status === 'cancelled') return false;
    const billDate = new Date(bill.createdAt);
    const billDateStr = bill.createdAt.slice(0, 10);

    if (timeRange === 'today') return billDateStr === todayStr;
    if (timeRange === 'yesterday') return billDateStr === yesterdayStr;
    if (timeRange === 'week') return billDate >= sevenDaysAgo;
    if (timeRange === 'month') return billDate >= firstDayOfMonth;
    if (timeRange === 'custom') {
      return billDateStr >= fromDate && billDateStr <= toDate;
    }
    return true;
  });

  const paidBills = filteredBills.filter(b => b.status === 'paid');

  // KPI calculations
  const totalRevenue = paidBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalOrders = paidBills.length;
  const avgBillValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalGst = Math.round(paidBills.reduce((acc, b) => acc + b.totalGst, 0));
  const totalDiscount = Math.round(paidBills.reduce((acc, b) => acc + (b.billDiscountAmount || 0), 0));

  // Payment Breakdown
  const cashAmount = paidBills
    .filter(b => b.paymentMethod === 'cash')
    .reduce((acc, b) => acc + b.grandTotal, 0);
  const upiAmount = paidBills
    .filter(b => b.paymentMethod === 'upi')
    .reduce((acc, b) => acc + b.grandTotal, 0);
  const cardAmount = paidBills
    .filter(b => b.paymentMethod === 'card')
    .reduce((acc, b) => acc + b.grandTotal, 0);
  const splitAmount = paidBills
    .filter(b => b.paymentMethod === 'split')
    .reduce((acc, b) => acc + b.grandTotal, 0);

  // Hourly Sales distribution (24-hour bins)
  const hourlySales = Array(24).fill(0);
  paidBills.forEach(bill => {
    const hour = new Date(bill.createdAt).getHours();
    hourlySales[hour] += bill.grandTotal;
  });
  const maxHourlySale = Math.max(...hourlySales, 1);

  // Item-wise sales aggregation
  const itemMap = new Map<string, { name: string; code: string; qty: number; revenue: number }>();
  paidBills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = itemMap.get(item.menuItemId) || {
        name: item.name,
        code: item.code,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemMap.set(item.menuItemId, existing);
    });
  });

  const itemSalesList = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);
  const topSelling = itemSalesList.slice(0, 5);
  const leastSelling = itemSalesList.slice(-5).reverse();

  const handleExportPDF = () => {
    exportSalesReportPDF(
      `Sales Report (${timeRange.toUpperCase()})`,
      {
        totalRevenue,
        totalBills: totalOrders,
        totalGst,
        avgBillValue,
        cashAmount,
        upiAmount,
        cardAmount,
      },
      paidBills,
      settings
    );
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header & Range Filters */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Business Analytics & Sales Reports
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Revenue metrics, tax summaries, payment modes, and rush hours
          </p>
        </div>

        {/* Export & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs overflow-x-auto scrollbar-none">
            {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                  timeRange === range
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => exportBillsToExcel(paidBills, `Sales_Report_${timeRange}.xlsx`)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {timeRange === 'custom' && (
        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800"
            />
          </div>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Revenue
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-700 font-mono tracking-tight">
            {settings.currencySymbol}{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalOrders} bills settled
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Bills
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {totalOrders}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            Orders completed
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Avg Ticket Value
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono tracking-tight">
            {settings.currencySymbol}{avgBillValue}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Per customer
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            GST Collected
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono tracking-tight">
            {settings.currencySymbol}{totalGst.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            CGST + SGST
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Discounts
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono tracking-tight">
            {settings.currencySymbol}{totalDiscount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Given to guests
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Sales Distribution */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Hourly Sales Rush Hours (24h)
            </h3>
            <span className="text-xs text-slate-500">Rush pattern analysis</span>
          </div>

          <div className="h-44 flex items-end gap-1 sm:gap-2 pt-4 px-1">
            {hourlySales.map((amount, hour) => {
              const heightPct = Math.round((amount / maxHourlySale) * 100);
              const label = hour % 3 === 0 ? `${hour}:00` : '';

              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 font-mono">
                    {hour}:00 - {settings.currencySymbol}{amount}
                  </div>

                  <div
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      amount > 0
                        ? 'bg-teal-500 group-hover:bg-teal-600'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono h-3">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Payment Distribution
            </h3>
            <span className="text-xs text-slate-500">Cash vs UPI vs Card</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {settings.currencySymbol}{cashAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (cashAmount / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <QrCode className="w-3.5 h-3.5 text-teal-600" /> UPI QR
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {settings.currencySymbol}{upiAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (upiAmount / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CreditCard className="w-3.5 h-3.5 text-sky-600" /> Card Swipes
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {settings.currencySymbol}{cardAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (cardAmount / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {splitAmount > 0 && (
              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> Split
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {settings.currencySymbol}{splitAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalRevenue > 0 ? (splitAmount / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top & Least Selling Dishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Award className="w-4 h-4 text-amber-500" />
            Top 5 Best-Selling Dishes
          </h3>
          <div className="space-y-2 text-xs">
            {topSelling.length === 0 ? (
              <div className="text-slate-400 text-center py-4">No dish sales recorded yet</div>
            ) : (
              topSelling.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-700 font-mono">{settings.currencySymbol}{item.revenue}</div>
                    <div className="text-[10px] text-slate-500">{item.qty} sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            Least Selling Dishes (Need Promotion)
          </h3>
          <div className="space-y-2 text-xs">
            {leastSelling.length === 0 ? (
              <div className="text-slate-400 text-center py-4">No dish sales recorded yet</div>
            ) : (
              leastSelling.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-700">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-700 font-mono">{settings.currencySymbol}{item.revenue}</div>
                    <div className="text-[10px] text-slate-500">{item.qty} sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
