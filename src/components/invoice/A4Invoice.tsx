import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bill, HotelSettings } from '../../types';
import { formatDateTime, generateUPIString } from '../../utils/helpers';

interface A4InvoiceProps {
  bill: Bill;
  settings: HotelSettings;
  size?: 'a4' | 'a5';
}

export const A4Invoice: React.FC<A4InvoiceProps> = ({ bill, settings, size = 'a4' }) => {
  const isA5 = size === 'a5';
  const upiUrl = generateUPIString(settings.upiId, settings.upiPayeeName, bill.grandTotal, bill.billNumber);

  return (
    <div
      id="printable-a4-invoice"
      className={`mx-auto bg-white text-slate-900 font-sans select-text border border-slate-300 shadow-lg p-6 sm:p-8 ${
        isA5 ? 'max-w-[148mm] text-[11px]' : 'max-w-[210mm] text-xs'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          {settings.logoBase64 ? (
            <img
              src={settings.logoBase64}
              alt={settings.hotelName}
              className="w-16 h-16 object-contain rounded-lg border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-teal-800 text-white font-extrabold text-2xl flex items-center justify-center border border-teal-700 shadow-sm">
              {settings.hotelName.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {settings.hotelName}
            </h1>
            <p className="text-xs text-slate-600 font-medium">{settings.tagline}</p>
            <p className="text-xs text-slate-600 mt-0.5">{settings.addressLine1}, {settings.city} - {settings.pincode || '500081'}</p>
            <div className="text-[11px] text-slate-700 mt-1 space-x-3">
              <span><strong>Phone:</strong> {settings.phone}</span>
              <span><strong>Email:</strong> {settings.email}</span>
            </div>
          </div>
        </div>

        {/* Tax Badges */}
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white font-extrabold uppercase px-3 py-1 rounded text-xs tracking-wider mb-2">
            Tax Invoice
          </span>
          <div className="text-xs text-slate-800 space-y-0.5">
            <div><strong>GSTIN:</strong> <span className="font-mono font-bold">{settings.gstin}</span></div>
            <div><strong>FSSAI Lic:</strong> <span className="font-mono">{settings.fssaiNumber}</span></div>
          </div>
        </div>
      </div>

      {/* Invoice Meta & Customer Row */}
      <div className="grid grid-cols-2 gap-6 my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 text-teal-800">
            Invoice Details
          </h3>
          <div className="space-y-0.5">
            <div><strong>Invoice No:</strong> <span className="font-mono font-bold">{bill.billNumber}</span></div>
            <div><strong>Date & Time:</strong> {formatDateTime(bill.createdAt)}</div>
            <div><strong>Order Type:</strong> <span className="font-semibold uppercase">{bill.orderType.replace('_', ' ')}</span></div>
            {bill.tableNumber && <div><strong>Table:</strong> <span className="font-bold text-teal-800">{bill.tableNumber}</span></div>}
            {bill.roomNumber && <div><strong>Room:</strong> <span className="font-bold text-indigo-800">{bill.roomNumber}</span></div>}
            <div><strong>Cashier:</strong> {bill.cashierName}</div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 text-teal-800">
            Billed To Customer
          </h3>
          <div className="space-y-0.5">
            <div><strong>Name:</strong> {bill.customerName || 'Walk-in Guest'}</div>
            {bill.customerPhone && <div><strong>Phone:</strong> <span className="font-mono">{bill.customerPhone}</span></div>}
            <div><strong>Payment Mode:</strong> <span className="font-bold uppercase text-slate-800">{bill.paymentMethod}</span></div>
            {bill.paymentReference && <div><strong>Payment Ref:</strong> <span className="font-mono">{bill.paymentReference}</span></div>}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-left border-collapse my-4 text-xs">
        <thead>
          <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
            <th className="py-2 px-2.5 text-center w-8">#</th>
            <th className="py-2 px-3">Item Description</th>
            <th className="py-2 px-2.5 text-center w-16">HSN</th>
            <th className="py-2 px-2.5 text-center w-12">Qty</th>
            <th className="py-2 px-3 text-right w-20">Rate</th>
            <th className="py-2 px-3 text-right w-20">Taxable</th>
            <th className="py-2 px-3 text-right w-20">CGST</th>
            <th className="py-2 px-3 text-right w-20">SGST</th>
            <th className="py-2 px-3 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
          {bill.items.map((item, index) => {
            const itemNet = (item.price * item.quantity) - (item.discountAmount || 0);
            const rate = item.gstRate || 5;
            const halfRate = rate / 2;
            const taxPart = bill.gstMode === 'inclusive'
              ? itemNet - (itemNet / (1 + rate / 100))
              : (itemNet * rate) / 100;
            const taxable = bill.gstMode === 'inclusive' ? itemNet - taxPart : itemNet;
            const cgst = taxPart / 2;
            const sgst = taxPart / 2;
            const lineTotal = bill.gstMode === 'inclusive' ? itemNet : itemNet + taxPart;

            return (
              <tr key={item.id || index} className="hover:bg-slate-50">
                <td className="py-2 px-2.5 text-center font-mono text-slate-500">{index + 1}</td>
                <td className="py-2 px-3 font-semibold text-slate-800">
                  {item.name}
                  {item.notes && <span className="block text-[10px] text-slate-500 font-normal italic">Note: {item.notes}</span>}
                </td>
                <td className="py-2 px-2.5 text-center font-mono text-slate-500">{item.hsnCode || '2106'}</td>
                <td className="py-2 px-2.5 text-center font-bold font-mono">{item.quantity}</td>
                <td className="py-2 px-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-mono">₹{taxable.toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">{halfRate}%</span>
                  ₹{cgst.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">{halfRate}%</span>
                  ₹{sgst.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{lineTotal.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Row */}
      <div className="grid grid-cols-12 gap-6 my-4">
        {/* Left: Dynamic UPI QR and Bank details */}
        <div className="col-span-7 space-y-3">
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="p-1 bg-white border border-slate-300 rounded shadow-xs shrink-0">
              <QRCodeSVG value={upiUrl} size={76} level="M" />
            </div>
            <div className="text-[11px] space-y-0.5">
              <div className="font-bold text-slate-900">Scan & Pay via UPI App</div>
              <div className="text-slate-600 font-mono">VPA: <strong>{settings.upiId}</strong></div>
              <div className="text-slate-600">Payee: {settings.upiPayeeName}</div>
              <div className="text-[10px] text-slate-500">Fast & Zero Surcharge Digital Payment</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-600 space-y-1">
            <div className="font-bold uppercase tracking-wider text-slate-800">Terms & Conditions:</div>
            <p className="whitespace-pre-line leading-relaxed">{settings.termsAndConditions}</p>
          </div>
        </div>

        {/* Right: Totals Box */}
        <div className="col-span-5 space-y-1.5 text-xs bg-slate-50 p-4 border border-slate-200 rounded-xl">
          <div className="flex justify-between text-slate-700">
            <span>Items Subtotal:</span>
            <span className="font-mono font-semibold">₹{bill.subtotal.toFixed(2)}</span>
          </div>

          {bill.billDiscountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span className="font-mono font-semibold">-₹{bill.billDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          {bill.serviceChargeAmount && bill.serviceChargeAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>Service Charge:</span>
              <span className="font-mono font-semibold">₹{bill.serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-700">
            <span>Taxable Amount:</span>
            <span className="font-mono font-semibold">₹{bill.taxableAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span>CGST:</span>
            <span className="font-mono font-semibold">₹{bill.cgstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span>SGST:</span>
            <span className="font-mono font-semibold">₹{bill.sgstAmount.toFixed(2)}</span>
          </div>

          {bill.roundingOff && bill.roundingOff !== 0 && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Round Off:</span>
              <span className="font-mono">{bill.roundingOff > 0 ? `+₹${bill.roundingOff}` : `-₹${Math.abs(bill.roundingOff)}`}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900 mt-2">
            <span>Grand Total:</span>
            <span className="font-mono text-base text-teal-800">₹{bill.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature Row */}
      <div className="flex items-end justify-between pt-8 mt-6 border-t border-slate-200 text-xs text-slate-600">
        <div>
          <p className="font-semibold text-slate-800">{settings.footerMessage}</p>
          <p className="text-[10px] text-slate-500">This is a computer generated tax invoice.</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-slate-400 mb-1"></div>
          <p className="font-bold text-slate-800 text-[11px]">Authorized Signatory</p>
          <p className="text-[10px] text-slate-500">For {settings.hotelName}</p>
        </div>
      </div>
    </div>
  );
};
