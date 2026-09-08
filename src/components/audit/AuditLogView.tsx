import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  Clock, 
  User, 
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { formatDateTime } from '../../utils/helpers';
import * as XLSX from 'xlsx';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useBilling();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const allActions = Array.from(new Set(auditLogs.map(l => l.action)));

  const handleExportLogsExcel = () => {
    const data = filteredLogs.map((log, index) => ({
      '#': index + 1,
      'Timestamp': formatDateTime(log.timestamp),
      'Operator / User': log.userName,
      'Action Event': log.action,
      'Event Details': log.details,
      'Associated Bill ID': log.billId || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditTrail');
    XLSX.writeFile(workbook, `Hotel_Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CANCEL') || action.includes('DELETE') || action.includes('RESET')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('REFUND') || action.includes('HOLD')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('BILL') || action.includes('BACKUP') || action.includes('LOGIN')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Audit Logs & Security Trail
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Complete tamper-evident record of all billing, discounts, cancellations, and staff actions
          </p>
        </div>

        <button
          onClick={handleExportLogsExcel}
          className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, cashier name, or event keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 w-full sm:w-56"
        >
          <option value="all">All Action Events ({auditLogs.length})</option>
          {allActions.map(act => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">Date & Time</th>
                <th className="py-3 px-3 w-40">Operator</th>
                <th className="py-3 px-3 w-36">Action</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(log.timestamp)}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span className="truncate">{log.userName}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-700">
                      <div>{log.details}</div>
                      {log.billId && (
                        <span className="text-[10px] text-teal-700 font-mono font-bold">
                          Ref: {log.billId}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
