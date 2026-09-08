import React, { useState } from 'react';
import { 
  BedDouble, 
  UtensilsCrossed, 
  User, 
  Phone, 
  Receipt, 
  Search, 
  CheckCircle2, 
  UserPlus, 
  Calendar 
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { Room } from '../../types';

export const RoomManager: React.FC = () => {
  const { rooms, loadRoomOrder, settings, showToast } = useBilling();
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [search, setSearch] = useState('');

  // Check-in modal
  const [checkInModalRoom, setCheckInModalRoom] = useState<Room | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;

  const filteredRooms = rooms.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch =
      r.number.includes(search) ||
      (r.guestName && r.guestName.toLowerCase().includes(search.toLowerCase())) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInModalRoom) return;
    checkInModalRoom.status = 'occupied';
    checkInModalRoom.guestName = guestName;
    checkInModalRoom.guestPhone = guestPhone;
    checkInModalRoom.checkInDate = new Date().toISOString().slice(0, 10);
    showToast(`Room ${checkInModalRoom.number} checked in for ${guestName}`, 'success');
    setCheckInModalRoom(null);
    setGuestName('');
    setGuestPhone('');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header & Stats */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <BedDouble className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Hotel Rooms & Room Service
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Guest Rooms 101 to 110 • In-room food ordering, billing to Room Tab & settlement
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-2.5">
              <div className="text-xs text-slate-400 font-medium">Total Rooms</div>
              <div className="text-lg font-bold text-white">{totalRooms}</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
              <div className="text-xs text-emerald-400 font-medium">Vacant</div>
              <div className="text-lg font-bold text-emerald-400">{availableRooms}</div>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5">
              <div className="text-xs text-indigo-400 font-medium">Occupied</div>
              <div className="text-lg font-bold text-indigo-400">{occupiedRooms}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Rooms ({totalRooms})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'available'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🟢 Vacant ({availableRooms})
            </button>
            <button
              onClick={() => setFilter('occupied')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'occupied'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔵 Occupied ({occupiedRooms})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search room or guest..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'occupied';

          return (
            <div
              key={room.id}
              className={`rounded-2xl border p-4 transition-all duration-200 shadow-md flex flex-col justify-between ${
                isOccupied
                  ? 'border-indigo-500/40 bg-gradient-to-b from-slate-800/95 to-indigo-950/30'
                  : 'border-slate-700/50 bg-slate-800/70 hover:border-emerald-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      {room.number}
                    </span>
                    <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/40">
                      {room.type}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isOccupied
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>

                {isOccupied ? (
                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{room.guestName || 'In-House Guest'}</span>
                    </div>

                    {room.guestPhone && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{room.guestPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-700/40 mt-2">
                      <span className="text-slate-400 text-[11px]">Room Service Tab</span>
                      <span className="text-indigo-400 font-bold">
                        {settings.currencySymbol}{room.currentAmount || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="my-6 text-center">
                    <span className="text-xs text-slate-400 font-medium">Vacant & Clean</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-700/50 space-y-2">
                {isOccupied ? (
                  <button
                    onClick={() => loadRoomOrder(room)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Room Service Order
                  </button>
                ) : (
                  <button
                    onClick={() => setCheckInModalRoom(room)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-600/40"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    Check-in Guest
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guest Check-in Modal */}
      {checkInModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-indigo-400" />
                Check-in Room {checkInModalRoom.number}
              </h3>
              <button onClick={() => setCheckInModalRoom(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Primary Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Confirm Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
