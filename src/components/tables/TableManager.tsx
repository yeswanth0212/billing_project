import React, { useState } from 'react';
import { 
  Users, 
  Utensils, 
  ArrowRightLeft, 
  Merge, 
  Receipt, 
  PlusCircle, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Phone, 
  User as UserIcon,
  Search
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { Table, TableStatus } from '../../types';

export const TableManager: React.FC = () => {
  const { 
    tables, 
    openTable, 
    loadTableOrder, 
    transferTable, 
    mergeTables, 
    generateKOT,
    settings 
  } = useBilling();

  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [openTableModal, setOpenTableModal] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');

  const [transferModalSource, setTransferModalSource] = useState<Table | null>(null);
  const [targetTableNo, setTargetTableNo] = useState<string>('');

  const [mergeModalSource, setMergeModalSource] = useState<Table | null>(null);
  const [mergeTargetTableNo, setMergeTargetTableNo] = useState<string>('');

  // Metrics
  const totalTables = tables.length;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const billedCount = tables.filter(t => t.status === 'billed').length;

  const filteredTables = tables.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleOpenTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTableModal) return;
    await openTable(openTableModal, guestCount, guestName, guestPhone);
    setOpenTableModal(null);
    setGuestName('');
    setGuestPhone('');
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalSource || !targetTableNo) return;
    const success = await transferTable(transferModalSource.number, targetTableNo);
    if (success) {
      setTransferModalSource(null);
      setTargetTableNo('');
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeModalSource || !mergeTargetTableNo) return;
    const success = await mergeTables(mergeModalSource.number, mergeTargetTableNo);
    if (success) {
      setMergeModalSource(null);
      setMergeTargetTableNo('');
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header & Stats */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <Utensils className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dining Floor & Table Management
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Live status for restaurant tables T1 to T20 • Open tables, take orders, merge or transfer
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-2.5">
              <div className="text-xs text-slate-400 font-medium">Total</div>
              <div className="text-lg font-bold text-white">{totalTables}</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
              <div className="text-xs text-emerald-400 font-medium">Available</div>
              <div className="text-lg font-bold text-emerald-400">{availableCount}</div>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5">
              <div className="text-xs text-amber-400 font-medium">Occupied</div>
              <div className="text-lg font-bold text-amber-400">{occupiedCount}</div>
            </div>
            <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-2.5">
              <div className="text-xs text-sky-400 font-medium">Billed</div>
              <div className="text-lg font-bold text-sky-400">{billedCount}</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Tables ({totalTables})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🟢 Available ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'occupied'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🟡 Occupied ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('billed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'billed'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔵 Billed ({billedCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or guest..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 w-full sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Tables Grid (T1 to T20) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isBilled = table.status === 'billed';
          const isAvailable = table.status === 'available';

          const cardBorder = isOccupied
            ? 'border-amber-500/40 bg-gradient-to-b from-slate-800/95 to-amber-950/20 hover:border-amber-400'
            : isBilled
            ? 'border-sky-500/40 bg-gradient-to-b from-slate-800/95 to-sky-950/20 hover:border-sky-400'
            : 'border-slate-700/50 bg-slate-800/70 hover:border-emerald-500/50 hover:bg-slate-800/90';

          return (
            <div
              key={table.id}
              className={`rounded-2xl border p-4 transition-all duration-200 shadow-md flex flex-col justify-between relative group ${cardBorder}`}
            >
              {/* Header: Table Number & Status badge */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {table.number}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-700/40">
                      <Users className="w-3 h-3 text-slate-400" />
                      {table.capacity}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isOccupied
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : isBilled
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* Occupied Details */}
                {isOccupied && (
                  <div className="space-y-1.5 my-3 text-xs">
                    {table.customerName && (
                      <div className="text-slate-200 font-medium flex items-center gap-1.5 truncate">
                        <UserIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{table.customerName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-300 font-semibold bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/40">
                      <span className="text-slate-400 text-[11px]">{table.orderItems?.length || 0} items</span>
                      <span className="text-amber-400 font-bold">
                        {settings.currencySymbol}{table.currentAmount || 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Billed Details */}
                {isBilled && (
                  <div className="space-y-1.5 my-3 text-xs">
                    <div className="text-sky-300 font-medium flex items-center justify-between bg-sky-950/40 px-2.5 py-1.5 rounded-lg border border-sky-500/30">
                      <span>Awaiting Payment</span>
                      <span className="font-bold text-white">
                        {settings.currencySymbol}{table.currentAmount || 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Available Empty space placeholder */}
                {isAvailable && (
                  <div className="my-6 text-center">
                    <span className="text-xs text-slate-400 font-medium">Ready for Guests</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-700/50 space-y-2">
                {isAvailable ? (
                  <button
                    onClick={() => {
                      setOpenTableModal(table);
                      setGuestCount(table.capacity > 4 ? 4 : 2);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Open Table
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => loadTableOrder(table)}
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-600/20"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Take Order / Settle
                    </button>

                    {isOccupied && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setTransferModalSource(table)}
                          title="Transfer Table"
                          className="py-1 bg-slate-700/80 hover:bg-slate-650 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-600/40 transition-colors"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                          Transfer
                        </button>
                        <button
                          onClick={() => setMergeModalSource(table)}
                          title="Merge Tables"
                          className="py-1 bg-slate-700/80 hover:bg-slate-650 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-600/40 transition-colors"
                        >
                          <Merge className="w-3 h-3 text-sky-400" />
                          Merge
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Table Modal */}
      {openTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                Open Table {openTableModal.number}
              </h3>
              <button
                onClick={() => setOpenTableModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenTableSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Guests Count</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 4, 6, 8].map(cnt => (
                    <button
                      type="button"
                      key={cnt}
                      onClick={() => setGuestCount(cnt)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                        guestCount === cnt
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Customer / Guest Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Sharma"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Customer Mobile (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenTableModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  Open Table & Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {transferModalSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                Transfer From Table {transferModalSource.number}
              </h3>
              <button onClick={() => setTransferModalSource(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select an available table to move all current orders and billing details.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Table (Available Only)</label>
                <select
                  value={targetTableNo}
                  onChange={e => setTargetTableNo(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="">-- Choose Available Table --</option>
                  {tables
                    .filter(t => t.status === 'available')
                    .map(t => (
                      <option key={t.id} value={t.number}>
                        {t.number} ({t.capacity} Seater)
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalSource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetTableNo}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-amber-600/20"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {mergeModalSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Merge className="w-4 h-4 text-sky-400" />
                Merge Table {mergeModalSource.number} Into Another
              </h3>
              <button onClick={() => setMergeModalSource(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleMergeSubmit} className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select another occupied table to combine all food items into a single bill.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Table (Occupied)</label>
                <select
                  value={mergeTargetTableNo}
                  onChange={e => setMergeTargetTableNo(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="">-- Choose Target Table --</option>
                  {tables
                    .filter(t => t.id !== mergeModalSource.id && t.status === 'occupied')
                    .map(t => (
                      <option key={t.id} value={t.number}>
                        {t.number} ({t.customerName ? `${t.customerName} • ` : ''}₹{t.currentAmount || 0})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMergeModalSource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!mergeTargetTableNo}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-sky-600/20"
                >
                  Confirm Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
