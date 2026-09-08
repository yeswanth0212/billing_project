import React from 'react';
import { KOT } from '../../types';
import { formatDateTime } from '../../utils/helpers';

interface KotReceiptProps {
  kot: KOT;
}

export const KotReceipt: React.FC<KotReceiptProps> = ({ kot }) => {
  return (
    <div
      id="printable-kot"
      className="mx-auto bg-white text-black p-4 font-mono leading-tight select-text text-xs max-w-[80mm] border border-gray-300 shadow-sm"
      style={{ fontFamily: "'JetBrains Mono', Courier, monospace" }}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-black space-y-1">
        <h2 className="text-base font-black tracking-wider uppercase">
          *** KITCHEN ORDER TICKET ***
        </h2>
        <div className="text-sm font-extrabold bg-black text-white py-0.5 px-2 rounded inline-block">
          {kot.kotNumber}
        </div>
      </div>

      {/* Meta */}
      <div className="my-2 text-xs space-y-1">
        <div className="flex justify-between font-bold">
          <span>TYPE: {kot.orderType.toUpperCase().replace('_', ' ')}</span>
          <span className="text-sm font-black text-rose-700">
            {kot.tableNumber ? `TABLE: ${kot.tableNumber}` : kot.roomNumber ? `ROOM: ${kot.roomNumber}` : 'COUNTER'}
          </span>
        </div>
        <div className="flex justify-between text-gray-700 text-[11px]">
          <span>Server: {kot.waiterName || 'Staff'}</span>
          <span>Time: {formatDateTime(kot.createdAt).slice(11)}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="border-t-2 border-b-2 border-black py-1.5 my-2">
        <div className="grid grid-cols-12 font-black text-xs mb-1 border-b border-gray-400 pb-1">
          <span className="col-span-2 text-center">QTY</span>
          <span className="col-span-7">ITEM NAME</span>
          <span className="col-span-3 text-right">CODE</span>
        </div>

        <div className="space-y-2 pt-1">
          {kot.items.map((item, i) => (
            <div key={i} className="text-xs">
              <div className="grid grid-cols-12 font-bold">
                <span className="col-span-2 text-center text-sm font-black">{item.quantity}</span>
                <span className="col-span-7 font-black text-sm">{item.name}</span>
                <span className="col-span-3 text-right text-[11px] font-normal text-gray-600">{item.code}</span>
              </div>
              {item.notes && (
                <div className="ml-8 text-[11px] font-bold text-red-600 italic">
                  * Instruction: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Kitchen Instructions */}
      {kot.specialInstructions && (
        <div className="my-2 p-1.5 bg-yellow-50 border border-yellow-300 rounded text-[11px] font-bold text-gray-900">
          Chef Note: {kot.specialInstructions}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-600">
        <p>Prepared by Front POS • Please expedite order</p>
      </div>
    </div>
  );
};
