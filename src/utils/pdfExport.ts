import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill, HotelSettings } from '../types';
import { formatCurrency, formatDateTime } from './helpers';

export const exportInvoicePDF = (bill: Bill, settings: HotelSettings) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.hotelName, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.tagline || 'Luxury Dining & Hospitality', pageWidth / 2, 26, { align: 'center' });
  doc.text(`${settings.addressLine1}, ${settings.city}`, pageWidth / 2, 31, { align: 'center' });
  doc.text(`Phone: ${settings.phone} | GSTIN: ${settings.gstin} | FSSAI: ${settings.fssaiNumber}`, pageWidth / 2, 36, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 42, pageWidth - 14, 42);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, 48, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${bill.billNumber}`, 14, 56);
  doc.text(`Date: ${formatDateTime(bill.createdAt)}`, 14, 61);
  doc.text(`Order Type: ${bill.orderType.toUpperCase()}`, 14, 66);
  if (bill.tableNumber) doc.text(`Table: ${bill.tableNumber}`, 14, 71);
  if (bill.roomNumber) doc.text(`Room: ${bill.roomNumber}`, 14, 71);

  doc.text(`Customer: ${bill.customerName || 'Walk-in'}`, pageWidth - 70, 56);
  doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, pageWidth - 70, 61);
  doc.text(`Payment: ${bill.paymentMethod.toUpperCase()}`, pageWidth - 70, 66);
  doc.text(`Cashier: ${bill.cashierName}`, pageWidth - 70, 71);

  const startY = bill.tableNumber || bill.roomNumber ? 76 : 72;

  const tableData = bill.items.map((item, index) => [
    index + 1,
    item.name,
    item.code,
    item.hsnCode || '2106',
    `₹${item.price.toFixed(2)}`,
    item.quantity,
    `₹${(item.price * item.quantity).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY,
    head: [['#', 'Item Description', 'Code', 'HSN', 'Rate', 'Qty', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 118, 110], // Teal
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8.5,
    }
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const summaryX = pageWidth - 75;

  doc.setFontSize(9);
  doc.text(`Subtotal:`, summaryX, finalY);
  doc.text(`₹${bill.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });

  let curY = finalY;
  if (bill.billDiscountAmount && bill.billDiscountAmount > 0) {
    curY += 6;
    doc.text(`Discount:`, summaryX, curY);
    doc.text(`-₹${bill.billDiscountAmount.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });
  }

  if (bill.serviceChargeAmount && bill.serviceChargeAmount > 0) {
    curY += 6;
    doc.text(`Service Charge:`, summaryX, curY);
    doc.text(`₹${bill.serviceChargeAmount.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });
  }

  curY += 6;
  doc.text(`Taxable Amount:`, summaryX, curY);
  doc.text(`₹${bill.taxableAmount.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });

  curY += 6;
  doc.text(`CGST (2.5%):`, summaryX, curY);
  doc.text(`₹${bill.cgstAmount.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });

  curY += 6;
  doc.text(`SGST (2.5%):`, summaryX, curY);
  doc.text(`₹${bill.sgstAmount.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });

  curY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Grand Total:`, summaryX, curY);
  doc.text(`₹${bill.grandTotal.toFixed(2)}`, pageWidth - 14, curY, { align: 'right' });

  // Terms & Conditions and Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Terms & Conditions: Goods once sold will not be returned. Computer generated invoice.', 14, curY + 15);
  doc.text(settings.footerMessage, pageWidth / 2, curY + 22, { align: 'center' });

  doc.save(`Invoice_${bill.billNumber}.pdf`);
};

export const exportSalesReportPDF = (
  reportTitle: string,
  stats: {
    totalRevenue: number;
    totalBills: number;
    totalGst: number;
    avgBillValue: number;
    cashAmount: number;
    upiAmount: number;
    cardAmount: number;
  },
  bills: Bill[],
  settings: HotelSettings
) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.hotelName, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.text(reportTitle, pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${formatDateTime(new Date().toISOString())}`, pageWidth / 2, 30, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 34, pageWidth - 14, 34);

  // Stats Box
  doc.setFontSize(9);
  doc.text(`Total Revenue: ₹${stats.totalRevenue.toLocaleString('en-IN')}`, 14, 41);
  doc.text(`Settled Invoices: ${stats.totalBills}`, 75, 41);
  doc.text(`Average Ticket: ₹${stats.avgBillValue.toFixed(2)}`, 140, 41);

  doc.text(`Cash: ₹${stats.cashAmount.toLocaleString('en-IN')}`, 14, 47);
  doc.text(`UPI: ₹${stats.upiAmount.toLocaleString('en-IN')}`, 75, 47);
  doc.text(`Card: ₹${stats.cardAmount.toLocaleString('en-IN')}`, 140, 47);

  const tableData = bills.slice(0, 40).map((b, i) => [
    i + 1,
    b.billNumber,
    formatDateTime(b.createdAt).slice(0, 16),
    b.orderType.toUpperCase(),
    b.tableNumber || b.roomNumber || 'Counter',
    b.paymentMethod.toUpperCase(),
    `₹${b.grandTotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 53,
    head: [['#', 'Invoice No', 'Date & Time', 'Type', 'Table/Room', 'Payment', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: { fontSize: 8 }
  });

  doc.save(`Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
