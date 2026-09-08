import React, { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';
import { ReceiptModal } from './components/invoice/ReceiptModal';
import { PosTerminal } from './components/pos/PosTerminal';
import { MenuManagement } from './components/menu/MenuManagement';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { BillHistory } from './components/history/BillHistory';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { useBilling } from './context/BillingContext';

export const App: React.FC = () => {
  const { activeTab } = useBilling();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* PWA Install Prompt Banner */}
      <PWAInstallBanner />

      {/* Top Navbar */}
      <Navbar onOpenUserModal={() => setIsLoginModalOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'pos' && <PosTerminal />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'reports' && <ReportsDashboard />}
        {activeTab === 'history' && <BillHistory />}
        {activeTab === 'audit' && <AuditLogView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation Bar (Shown on small screens) */}
      <MobileBottomNav />

      {/* Modals & Overlays */}
      <ReceiptModal />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <ToastContainer />
    </div>
  );
};

export default App;
