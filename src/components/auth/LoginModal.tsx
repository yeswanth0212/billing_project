import React, { useState } from 'react';
import { User, Lock, KeyRound, X, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBilling } from '../../context/BillingContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, login, switchUser } = useAuth();
  const { showToast } = useBilling();

  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.username || 'admin');
  const [pinOrPass, setPinOrPass] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(selectedUser, pinOrPass);
    if (success) {
      setError('');
      setPinOrPass('');
      showToast('Logged in successfully', 'success');
      onClose();
    } else {
      setError('Invalid password or PIN. Try admin123 / 1234, mgr123 / 2345, or cash123 / 1111');
    }
  };

  const handleQuickSwitch = async (username: string, pass: string) => {
    const success = await login(username, pass);
    if (success) {
      showToast(`Switched to ${username.toUpperCase()}`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Operator Authentication & Roles</h3>
              <p className="text-xs text-slate-500">Select account or enter password / PIN</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Accounts Quick-Switch Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Demo Accounts (1-Tap Test)</span>
            <span className="text-[11px] text-teal-700 font-bold">Touch to Switch</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSwitch('admin', 'admin123')}
              className="p-3 rounded-2xl border text-center transition-all bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border-slate-200 shadow-xs"
            >
              <div className="text-xs font-bold text-slate-900">Admin</div>
              <div className="text-[10px] text-amber-700 font-mono mt-0.5 font-bold">admin123</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Full Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('manager', 'mgr123')}
              className="p-3 rounded-2xl border text-center transition-all bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border-slate-200 shadow-xs"
            >
              <div className="text-xs font-bold text-slate-900">Manager</div>
              <div className="text-[10px] text-sky-700 font-mono mt-0.5 font-bold">mgr123</div>
              <div className="text-[9px] text-slate-500 mt-0.5">POS & Reports</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('cashier', 'cash123')}
              className="p-3 rounded-2xl border text-center transition-all bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border-slate-200 shadow-xs"
            >
              <div className="text-xs font-bold text-slate-900">Cashier</div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-bold">cash123</div>
              <div className="text-[9px] text-slate-500 mt-0.5">POS Billing</div>
            </button>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Username</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="admin">Admin (admin)</option>
              <option value="manager">Manager (manager)</option>
              <option value="cashier">Cashier (cashier)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password or Quick PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={pinOrPass}
                onChange={e => setPinOrPass(e.target.value)}
                placeholder="admin123 or 1234"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
