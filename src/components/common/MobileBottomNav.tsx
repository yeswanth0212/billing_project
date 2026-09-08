import React from 'react';
import { 
  Receipt, 
  UtensilsCrossed, 
  History, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useBilling();

  const tabs = [
    { id: 'pos', label: 'POS', icon: Receipt },
    { id: 'menu', label: 'Dishes', icon: UtensilsCrossed },
    { id: 'history', label: 'Invoices', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around select-none shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-teal-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
