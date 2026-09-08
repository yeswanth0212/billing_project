import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bill, HotelSettings } from '../../types';
import { formatDateTime, generateUPIString } from '../../utils/helpers';

interface ThermalReceiptProps {
  bill: Bill;
  settings: HotelSettings;
  paperWidth?: '58mm' | '80mm';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  bill,
  settings,
  paperWidth = settings.thermalPaperWidth || '80mm',
}) => {
  const is58 = paperWidth === '58mm';
  const upiUrl = generateUPIString(settings.upiId, settings.upiPayeeName, bill.grandTotal, bill.billNumber);

  return (
    <div
      id="printable-receipt"
      className={`mx-auto bg-white text-black p-3 sm:p-4 font-mono leading-tight select-text text-xs ${
        is58 ? 'max-w-[58mm] text-[10px]' : 'max-w-[80mm] text-xs'
      }`}
      style={{ fontFamily: "'JetBrains Mono', Courier, monospace" }}
    >
      {/* Header */}
      <div className="text-center space-y-0.5">
        {settings.logoBase64 && (
          <img
            src={settings.logoBase64}
            alt=""
            className="w-12 h-12 mx-auto object-contain mb-1"
          />
        )}
        <h2 className="text-sm font-black uppercase tracking-wider">
          {settings.hotelName}
        </h2>
        {settings.tagline && <p className="text-[10px] text-gray-700">{settings.tagline}</p>}
        <p className="text-[10px] text-gray-700">{settings.addressLine1}, {settings.city}</p>
        <p className="text-[10px] text-gray-700">Ph: {settings.phone}</p>
        <div className="text-[9px] font-bold mt-1 border-t border-b border-dashed border-gray-400 py-1">
          GSTIN: {settings.gstin} | FSSAI: {settings.fssaiNumber}
        </div>
      </div>

      {/* Bill Meta */}
      <div className="my-2 text-[10px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>INVOICE: {bill.billNumber}</span>
          <span className="uppercase font-black">
            {bill.tableNumber ? `TBL ${bill.tableNumber}` : bill.roomNumber ? `RM ${bill.roomNumber}` : bill.orderType}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Date: {formatDateTime(bill.createdAt)}</span>
        </div>
        {bill.customerName && (
          <div>Guest: {bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}</div>
        )}
        <div>Cashier: {bill.cashierName}</div>
      </div>

      {/* Items Table */}
      <div className="border-t border-b border-dashed border-gray-400 py-1 my-1">
        <div className="grid grid-cols-12 font-bold text-[10px] mb-1">
          <span className="col-span-6">ITEM</span>
          <span className="col-span-2 text-center">QTY</span>
          <span className="col-span-2 text-right">RATE</span>
          <span className="col-span-2 text-right">AMT</span>
        </div>

        <div className="space-y-1">
          {bill.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 text-[10px]">
              <span className="col-span-6 truncate font-medium">{item.name}</span>
              <span className="col-span-2 text-center font-bold">{item.quantity}</span>
              <span className="col-span-2 text-right">₹{item.price}</span>
              <span className="col-span-2 text-right font-semibold">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-0.5 text-[10px] pt-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{bill.subtotal.toFixed(2)}</span>
        </div>

        {bill.billDiscountAmount > 0 && (
          <div className="flex justify-between text-gray-800 font-bold">
            <span>Discount:</span>
            <span>-₹{bill.billDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        {bill.serviceChargeAmount && bill.serviceChargeAmount > 0 && (
          <div className="flex justify-between">
            <span>Service Charge:</span>
            <span>₹{bill.serviceChargeAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Taxable Amount:</span>
          <span>₹{bill.taxableAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>CGST (2.5%):</span>
          <span>₹{bill.cgstAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>SGST (2.5%):</span>
          <span>₹{bill.sgstAmount.toFixed(2)}</span>
        </div>

        {bill.roundingOff && bill.roundingOff !== 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Round Off:</span>
            <span>{bill.roundingOff > 0 ? `+₹${bill.roundingOff}` : `-₹${Math.abs(bill.roundingOff)}`}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between text-xs font-black border-t-2 border-b-2 border-black py-1 my-1">
          <span>NET PAYABLE:</span>
          <span className="text-sm">₹{bill.grandTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-bold text-[10px] pt-0.5">
          <span>PAYMENT: {bill.paymentMethod.toUpperCase()}</span>
          <span>STATUS: {bill.status.toUpperCase()}</span>
        </div>

        {bill.splitPayment && (
          <div className="text-[9px] text-gray-700 bg-gray-100 p-1 rounded mt-1">
            <span>Split: Cash: ₹{bill.splitPayment.cash} | UPI: ₹{bill.splitPayment.upi} | Card: ₹{bill.splitPayment.card}</span>
          </div>
        )}
      </div>

      {/* Dynamic UPI QR */}
      <div className="mt-3 text-center flex flex-col items-center justify-center border-t border-dashed border-gray-400 pt-2">
        <div className="p-1 bg-white border border-gray-300 inline-block shadow-xs">
          <QRCodeSVG value={upiUrl} size={is58 ? 85 : 100} level="M" />
        </div>
        <p className="text-[9px] font-bold mt-1">UPI: {settings.upiId}</p>
        <p className="text-[8px] text-gray-600">Scan & Pay via any UPI App</p>
      </div>

      {/* Footer */}
      <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400 text-[9px] text-gray-700 space-y-0.5">
        <p className="font-bold">{settings.footerMessage}</p>
        <p className="text-[8px] text-gray-500">Thank you for visiting us!</p>
      </div>
    </div>
  );
};
