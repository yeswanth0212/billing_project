import { Bill, HotelSettings } from '../types';
import { formatDateTime } from './helpers';

/**
 * Normalizes customer phone number for WhatsApp wa.me link.
 * Handles Indian numbers (default country code +91 for 10 digits)
 * as well as international formats.
 */
export const cleanPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If user entered 10 digits (e.g. 9876543210), prepend India country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If user entered 11 digits starting with 0 (e.g. 09876543210), strip 0 and prepend 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.substring(1)}`;
  }

  // If already 12 digits starting with 91, return as is
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return digits;
};

/**
 * Formats a comprehensive, stylish bill receipt text message for WhatsApp.
 */
export const formatBillForWhatsApp = (bill: Bill, settings: HotelSettings): string => {
  const currency = settings.currencySymbol || '₹';
  const divider = '━━━━━━━━━━━━━━━━━━━━';

  const lines: string[] = [];

  // Header
  lines.push(`🧾 *${(settings.hotelName || 'RESTAURANT & HOTEL').toUpperCase()}*`);
  if (settings.tagline) {
    lines.push(`_${settings.tagline}_`);
  }
  if (settings.addressLine1 || settings.city) {
    const loc = [settings.addressLine1, settings.city, settings.pincode].filter(Boolean).join(', ');
    lines.push(`📍 ${loc}`);
  }
  if (settings.phone) {
    lines.push(`📞 ${settings.phone}`);
  }
  if (settings.gstin || settings.fssaiNumber) {
    const ids = [
      settings.gstin ? `GST: ${settings.gstin}` : '',
      settings.fssaiNumber ? `FSSAI: ${settings.fssaiNumber}` : '',
    ].filter(Boolean).join(' | ');
    lines.push(`🏛️ ${ids}`);
  }

  lines.push(divider);

  // Invoice & Order Details
  lines.push(`📋 *TAX INVOICE: #${bill.billNumber}*`);
  lines.push(`📅 Date: ${formatDateTime(bill.createdAt)}`);
  
  if (bill.orderType === 'dine_in' && bill.tableNumber) {
    lines.push(`🍽️ Dine-In: *Table ${bill.tableNumber}*`);
  } else if (bill.orderType === 'room_service' && bill.roomNumber) {
    lines.push(`🏨 Room Service: *Room ${bill.roomNumber}*`);
  } else if (bill.orderType === 'takeaway') {
    lines.push(`🥡 Order Type: *Takeaway*`);
  } else {
    lines.push(`⚡ Order Type: *Quick Counter*`);
  }

  if (bill.customerName) {
    lines.push(`👤 Customer: *${bill.customerName}*`);
  }
  if (bill.customerPhone) {
    lines.push(`📱 Mobile: *${bill.customerPhone}*`);
  }

  lines.push(divider);

  // Ordered Items
  lines.push(`*ITEMS ORDERED:*`);
  bill.items.forEach((item, index) => {
    const variantStr = item.selectedVariant ? ` (${item.selectedVariant})` : '';
    const itemTotal = (item.price * item.quantity).toFixed(2);
    lines.push(`${index + 1}. *${item.name}${variantStr}*`);
    lines.push(`   ${item.quantity} x ${currency}${item.price.toFixed(2)} = *${currency}${itemTotal}*`);
    if (item.notes) {
      lines.push(`   _(Note: ${item.notes})_`);
    }
  });

  lines.push(divider);

  // Totals & Taxes Breakdown
  lines.push(`Subtotal: ${currency}${bill.subtotal.toFixed(2)}`);

  if (bill.billDiscountAmount && bill.billDiscountAmount > 0) {
    lines.push(`Discount: -${currency}${bill.billDiscountAmount.toFixed(2)}`);
  }

  if (bill.serviceChargeAmount && bill.serviceChargeAmount > 0) {
    lines.push(`Service Charge (${bill.serviceChargePercent}%): +${currency}${bill.serviceChargeAmount.toFixed(2)}`);
  }

  if (bill.cgstAmount > 0 || bill.sgstAmount > 0) {
    lines.push(`Taxable Amount: ${currency}${bill.taxableAmount.toFixed(2)}`);
    lines.push(`CGST (2.5%): +${currency}${bill.cgstAmount.toFixed(2)}`);
    lines.push(`SGST (2.5%): +${currency}${bill.sgstAmount.toFixed(2)}`);
  }

  if (bill.roundingOff && Math.abs(bill.roundingOff) > 0) {
    const sign = bill.roundingOff >= 0 ? '+' : '';
    lines.push(`Round Off: ${sign}${currency}${bill.roundingOff.toFixed(2)}`);
  }

  lines.push(divider);

  // Final Grand Total
  lines.push(`💰 *GRAND TOTAL: ${currency}${bill.grandTotal.toFixed(2)}*`);
  lines.push(`💳 Paid via: *${bill.paymentMethod.toUpperCase()}* (${bill.status.toUpperCase()} ✅)`);

  if (bill.paymentReference) {
    lines.push(`Ref No: ${bill.paymentReference}`);
  }

  lines.push(divider);

  // Footer Message
  if (settings.footerMessage) {
    lines.push(settings.footerMessage);
  } else {
    lines.push('Thank you for dining with us! Please visit again.');
  }
  lines.push('🙏 *Have a wonderful day!*');

  return lines.join('\n');
};

/**
 * Builds the WhatsApp wa.me URI.
 */
export const getWhatsAppUrl = (bill: Bill, settings: HotelSettings, customPhone?: string): string => {
  const phoneToUse = customPhone || bill.customerPhone || '';
  const cleaned = cleanPhoneNumber(phoneToUse);
  const message = formatBillForWhatsApp(bill, settings);
  const encoded = encodeURIComponent(message);

  if (cleaned) {
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }
  // If no phone number, open wa.me with message to allow user to pick any contact
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Sends or opens WhatsApp with the bill.
 * Works seamlessly on mobile devices (opens WhatsApp app) and desktop (opens WhatsApp Web).
 */
export const sendBillToWhatsApp = (
  bill: Bill, 
  settings: HotelSettings, 
  customPhone?: string
): { success: boolean; url: string; error?: string } => {
  try {
    const url = getWhatsAppUrl(bill, settings, customPhone);
    // Open in a new tab/window which mobile OS translates to opening WhatsApp app
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback if popup blocker intercepted
      window.location.href = url;
    }
    return { success: true, url };
  } catch (err: any) {
    return { success: false, url: '', error: err?.message || 'Failed to open WhatsApp' };
  }
};

/**
 * Native mobile sharing using Web Share API if available.
 */
export const shareBillNative = async (
  bill: Bill, 
  settings: HotelSettings
): Promise<boolean> => {
  const text = formatBillForWhatsApp(bill, settings);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Bill #${bill.billNumber} - ${settings.hotelName}`,
        text: text,
      });
      return true;
    } catch {
      // User cancelled or share failed
      return false;
    }
  }
  return false;
};
