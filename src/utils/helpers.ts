import { HotelSettings } from '../types';

export const roundMoney = (amount: number): number => {
  return Math.round((Number(amount) || 0) * 100) / 100;
};

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  const safe = roundMoney(amount);
  return `${symbol}${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  return `${formatDate(isoString)} ${formatTime(isoString)}`;
};

/**
 * Generates an NPCI compliant BharatQR / UPI Deep Link URI
 * Format: upi://pay?pa={vpa}&pn={name}&am={amount}&tn=Bill_{billNo}&cu=INR
 */
export const generateUPIString = (
  vpa: string,
  payeeName: string,
  amount: number,
  billNumber: string
): string => {
  const safeVpa = encodeURIComponent(vpa || 'merchant@upi');
  const safeName = encodeURIComponent(payeeName || 'Hotel Billing');
  const safeBill = encodeURIComponent(`Bill ${billNumber}`);
  const formattedAmount = amount.toFixed(2);
  return `upi://pay?pa=${safeVpa}&pn=${safeName}&am=${formattedAmount}&tn=${safeBill}&cu=INR`;
};

// Web Audio API synthesized sounds (Zero external audio file dependencies, works 100% offline)
export const playSound = (type: 'beep' | 'success' | 'alert' | 'delete') => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.07);
        osc.stop(ctx.currentTime + index * 0.07 + 0.2);
      });
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Audio context may be restricted before user interaction
  }
};
