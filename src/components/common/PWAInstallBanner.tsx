import React, { useState, useEffect } from 'react';
import { Download, Share2, X, Smartphone, Sparkles, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-100/60 border-b border-teal-200 text-slate-900 px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold flex items-center gap-1.5 text-slate-900">
            <span>Install Hotel Billing App</span>
            <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-teal-300">
              100% Offline PWA
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            {isIOS
              ? 'On iPhone: Tap Share button ⎙ then select "Add to Home Screen"'
              : 'Install on your Android or PC home screen for instant offline access'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-full hover:bg-teal-200/50 text-slate-400 hover:text-slate-700 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
