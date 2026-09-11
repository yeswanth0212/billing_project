import React from 'react';
import { 
  Receipt, 
  UtensilsCrossed, 
  BarChart3, 
  History, 
  ShieldCheck, 
  Settings, 
  User as UserIcon,
  Sparkles,
  Building2
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';

interface NavbarProps {
  onOpenUserModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUserModal }) => {
  const { activeTab, setActiveTab, settings, bills, isOnline } = useBilling();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTotal = bills
    .filter(b => b.createdAt.startsWith(todayStr) && b.status === 'paid')
    .reduce((acc, b) => acc + b.grandTotal, 0);

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: Receipt },
    { id: 'menu', label: 'Menu Dishes', icon: UtensilsCrossed },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'history', label: 'Invoices', icon: History },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
      {/* Top Banner */}
      <div className="bg-teal-600 text-white px-4 py-1 text-xs flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          {/* Online / Offline Status Pill */}
          {isOnline ? (
            <span className="flex items-center gap-1.5 bg-teal-800/80 px-2.5 py-0.5 rounded-full text-[11px] text-emerald-200 font-bold border border-teal-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-amber-800/90 px-2.5 py-0.5 rounded-full text-[11px] text-amber-200 font-bold border border-amber-500/40">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              🟢 Working Offline
            </span>
          )}

          <span className="hidden sm:inline-flex items-center gap-1 text-teal-100 text-[11px]">
            <span className="font-semibold text-white">IndexedDB</span> Local Storage
          </span>

          <span className="hidden md:inline text-teal-300">|</span>
          <span className="hidden md:inline text-teal-100">
            GSTIN: <span className="font-mono font-bold text-white">{settings.gstin}</span>
          </span>
          <span className="hidden lg:inline text-teal-300">|</span>
          <span className="hidden lg:inline text-teal-100">
            FSSAI: <span className="font-mono text-white">{settings.fssaiNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-amber-400 text-amber-950 font-extrabold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3" />
            Lifetime License
          </span>
          <span className="text-teal-100 text-[11px]">
            Today's Sales: <strong className="text-white font-mono text-xs">{formatCurrency(todayTotal, settings.currencySymbol)}</strong>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
          {settings.logoBase64 ? (
            <img
              src={settings.logoBase64}
              alt=""
              className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-amber-400 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-teal-700 text-lg">
                {settings.hotelName.charAt(0)}
              </div>
            </div>
          )}
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight line-clamp-1">
              {settings.hotelName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
              {settings.tagline}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Light theme pills) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Pill / Login Switcher */}
        <button
          onClick={onOpenUserModal}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-3 py-1.5 rounded-2xl transition-all"
        >
          <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.name || 'Operator'}
            </div>
            <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
              {currentUser?.role || 'cashier'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
