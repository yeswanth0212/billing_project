import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  ShieldAlert, 
  AlertTriangle, 
  Image as ImageIcon,
  Building2,
  Receipt,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { useAuth } from '../../context/AuthContext';
import { HotelSettings } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { Storage } from '../../utils/storage';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    downloadBackupJSON, 
    restoreDatabase, 
    clearAllDatabaseData,
    showToast 
  } = useBilling();

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);

  const [formData, setFormData] = useState<HotelSettings>({ ...settings });
  const [storageStats, setStorageStats] = useState({
    totalBills: 0,
    totalMenuItems: 0,
    totalTables: 0,
    totalRooms: 0,
    totalKots: 0,
    totalLogs: 0,
    estimatedSizeKB: 0,
    estimatedSizeMB: '0.00',
    quotaMB: undefined as string | undefined,
    isPersisted: false,
  });

  const handleRequestPersistence = async () => {
    const granted = await Storage.requestPersistence();
    if (granted) {
      showToast('Mobile persistent storage granted! Data is protected from eviction.', 'success');
      const stats = await Storage.getStorageStats();
      setStorageStats(stats as any);
    } else {
      showToast('Storage persistence was not granted by your browser.', 'info');
    }
  };

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  // Clear DB State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...settings });
    Storage.getStorageStats().then(stats => setStorageStats(stats));
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Admin privilege required to alter hotel settings', 'error');
      return;
    }
    await updateSettings(formData);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo image must be under 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, logoBase64: base64 }));
      showToast('Logo uploaded. Click Save Settings to persist offline.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoBase64: undefined }));
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBackupFile(file);
      setIsRestoreModalOpen(true);
    }
  };

  const confirmRestore = async () => {
    if (!selectedBackupFile) return;
    try {
      const text = await selectedBackupFile.text();
      await restoreDatabase(text);
      setIsRestoreModalOpen(false);
      setSelectedBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast(`Restore failed: ${err.message || 'Invalid JSON file'}`, 'error');
    }
  };

  const confirmClearAll = async () => {
    if (clearConfirmText.trim().toUpperCase() !== 'RESET') {
      showToast('Please type RESET exactly to confirm', 'error');
      return;
    }
    await clearAllDatabaseData();
    setIsClearModalOpen(false);
    setClearConfirmText('');
  };

  const isBackupOutdated = !settings.lastBackupDate || 
    (Date.now() - new Date(settings.lastBackupDate).getTime() > 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 sm:pb-10">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hotel Profile & System Settings
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Configure GSTIN, FSSAI, local offline logo, UPI VPA, thermal printer width, and offline database
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-teal-800">
            IndexedDB: Offline Ready
          </span>
        </div>
      </div>

      {/* Backup Warning Banner if not backed up recently */}
      {isBackupOutdated && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-xs text-slate-700">
              <strong className="text-amber-900 block font-bold">Recommended: Back Up Your Database</strong>
              <span>
                {settings.lastBackupDate
                  ? `Last backup was created on ${formatDateTime(settings.lastBackupDate)}. Regular backups keep your offline billing secure.`
                  : 'You have not created a JSON database backup yet. Export a one-click backup to prevent data loss.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadBackupJSON}
            className="px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0 transition-all shadow-xs"
          >
            Backup Now
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
        {/* Hotel Logo Section (Stored locally in IndexedDB) */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            Hotel Brand Logo (Stored 100% Offline in IndexedDB)
          </h2>
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {formData.logoBase64 ? (
                <img src={formData.logoBase64} alt="Hotel Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="space-y-1.5 text-xs flex-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 text-xs"
                >
                  Upload Logo
                </button>
                {formData.logoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-rose-600 hover:bg-slate-300 font-semibold text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-slate-500 text-[11px]">
                PNG, JPEG, or SVG format under 2MB. Logo appears on thermal receipts and A4 tax invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Hotel Information Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            Establishment & Statutory Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Hotel / Restaurant Name</label>
              <input
                type="text"
                required
                value={formData.hotelName}
                onChange={e => setFormData({ ...formData, hotelName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Street Address</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">City, State & Pincode</label>
              <input
                type="text"
                value={`${formData.city}, ${formData.state || ''} ${formData.pincode || ''}`.trim()}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">GSTIN (Goods & Services Tax No)</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-teal-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">FSSAI Food License Number</label>
              <input
                type="text"
                value={formData.fssaiNumber}
                onChange={e => setFormData({ ...formData, fssaiNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Billing & Taxation Parameters */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            Billing, Tax & UPI Parameters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Hotel UPI VPA (for QR Payment)</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-teal-700 font-mono font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">UPI Payee Display Name</label>
              <input
                type="text"
                value={formData.upiPayeeName}
                onChange={e => setFormData({ ...formData, upiPayeeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Default GST Mode</label>
              <select
                value={formData.gstMode}
                onChange={e => setFormData({ ...formData, gstMode: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="exclusive">Exclusive (Add GST on top)</option>
                <option value="inclusive">Inclusive (Prices already include GST)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Default GST Rate (%)</label>
              <select
                value={formData.defaultGstRate}
                onChange={e => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
              >
                <option value={5}>5% (Restaurant)</option>
                <option value={12}>12% (Beverages)</option>
                <option value={18}>18% (Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Service Charge (%)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.serviceChargeRate || ''}
                onChange={e => setFormData({ ...formData, serviceChargeRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-medium mb-1">Thermal Printer Roll Width</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="thermalWidth"
                    value="80mm"
                    checked={formData.thermalPaperWidth === '80mm'}
                    onChange={() => setFormData({ ...formData, thermalPaperWidth: '80mm' })}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>80mm (Standard POS 3-inch Desktop Receipt)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                  <input
                    type="radio"
                    name="thermalWidth"
                    value="58mm"
                    checked={formData.thermalPaperWidth === '58mm'}
                    onChange={() => setFormData({ ...formData, thermalPaperWidth: '58mm' })}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>58mm (Portable 2-inch Bluetooth/Handheld)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Terms */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Receipt Footer Message</label>
            <input
              type="text"
              value={formData.footerMessage}
              onChange={e => setFormData({ ...formData, footerMessage: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Statutory Terms & Conditions</label>
            <textarea
              rows={3}
              value={formData.termsAndConditions}
              onChange={e => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={!isAdmin}
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Hotel Settings</span>
          </button>
        </div>
      </form>

      {/* DATA SAFETY & DATABASE MANAGEMENT HUB */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Data Safety, Backup & Database Hub
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Your billing database lives safely on this device via IndexedDB. Export JSON backups to keep data protected across devices.
          </p>
        </div>

        {/* Mobile Device Storage Status Banner */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm">Mobile Device Local Storage</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  100% Offline & Private
                </span>
                {storageStats.isPersisted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Persistent (Protected from phone cleanups)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors"
                  >
                    Enable Persistent Storage
                  </button>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                All bills, menus, and transactions are stored directly on this device's memory using IndexedDB. No external servers or internet needed.
              </p>
              <div className="flex items-center gap-3 text-slate-600 font-mono text-[11px] mt-1.5">
                <span>Used: <strong>{storageStats.estimatedSizeKB > 1024 ? `${storageStats.estimatedSizeMB} MB` : `${storageStats.estimatedSizeKB} KB`}</strong></span>
                {storageStats.quotaMB && (
                  <span>Available Quota: <strong>{storageStats.quotaMB} MB</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Database Record Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-slate-500 font-medium text-[10px]">Bills & Invoices</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{storageStats.totalBills}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-slate-500 font-medium text-[10px]">Menu Dishes</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{storageStats.totalMenuItems}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-slate-500 font-medium text-[10px]">Kitchen Tickets (KOTs)</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{storageStats.totalKots}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-slate-500 font-medium text-[10px]">Audit Security Logs</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{storageStats.totalLogs}</div>
          </div>
        </div>

        {/* Backup & Restore Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* One-Click Backup */}
            <button
              type="button"
              onClick={downloadBackupJSON}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>

            {/* One-Click Restore */}
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 border border-slate-200 transition-colors"
                >
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>Restore Database JSON</span>
                </button>
              </>
            )}
          </div>

          {/* Protected Clear All Data */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setClearConfirmText('');
                setIsClearModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoreModalOpen && selectedBackupFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restore Complete Database?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to restore data from <strong>{selectedBackupFile.name}</strong>. All current records will be updated with the backup content.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackupFile(null);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestore}
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Strong Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Wipe All Database Records?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will wipe all existing bills, transactions, and custom dishes, resetting the database back to clean seed defaults.
              </p>
            </div>

            <div className="text-left text-xs space-y-1">
              <label className="block text-slate-700 font-semibold">
                Type <strong className="text-rose-600">RESET</strong> to proceed:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={clearConfirmText}
                onChange={e => setClearConfirmText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-center font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmText.trim().toUpperCase() !== 'RESET'}
                onClick={confirmClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-sm"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
