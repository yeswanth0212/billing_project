import * as XLSX from 'xlsx';
import { Bill, MenuItem, Category } from '../types';
import { formatDateTime } from './helpers';

export const exportBillsToExcel = (bills: Bill[], filename: string = 'Hotel_Billing_Sales.xlsx') => {
  const data = bills.map((b, index) => ({
    'S.No': index + 1,
    'Bill Number': b.billNumber,
    'Date & Time': formatDateTime(b.createdAt),
    'Order Type': b.orderType.toUpperCase().replace('_', ' '),
    'Table / Room': b.tableNumber || b.roomNumber || 'Counter',
    'Customer Name': b.customerName || 'Walk-in',
    'Customer Phone': b.customerPhone || 'N/A',
    'Subtotal (₹)': b.subtotal,
    'Discount (₹)': b.billDiscountAmount || 0,
    'Service Charge (₹)': b.serviceChargeAmount || 0,
    'Taxable (₹)': b.taxableAmount,
    'CGST (₹)': b.cgstAmount,
    'SGST (₹)': b.sgstAmount,
    'Total GST (₹)': b.totalGst,
    'Grand Total (₹)': b.grandTotal,
    'Payment Mode': b.paymentMethod.toUpperCase(),
    'Status': b.status.toUpperCase(),
    'Cashier': b.cashierName,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');
  XLSX.writeFile(workbook, filename);
};

export const exportBillsToCSV = (bills: Bill[], filename: string = 'Hotel_Billing_Sales.csv') => {
  const data = bills.map((b, index) => ({
    'S.No': index + 1,
    'Bill Number': b.billNumber,
    'Date & Time': formatDateTime(b.createdAt),
    'Order Type': b.orderType,
    'Table/Room': b.tableNumber || b.roomNumber || 'Counter',
    'Customer': b.customerName || 'Walk-in',
    'Phone': b.customerPhone || '',
    'Subtotal': b.subtotal,
    'Discount': b.billDiscountAmount || 0,
    'Taxable': b.taxableAmount,
    'CGST': b.cgstAmount,
    'SGST': b.sgstAmount,
    'Grand Total': b.grandTotal,
    'Payment': b.paymentMethod,
    'Status': b.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportMenuItemsToExcel = (items: MenuItem[], categories: Category[], filename: string = 'Hotel_Menu_Catalog.xlsx') => {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const data = items.map(item => ({
    'Item Code': item.code,
    'Dish Name': item.name,
    'Category': catMap.get(item.categoryId) || 'Uncategorized',
    'Base Price (₹)': item.price,
    'GST Rate (%)': item.gstRate,
    'HSN Code': item.hsnCode || '2106',
    'Veg (Yes/No)': item.isVeg ? 'Yes' : 'No',
    'Spicy (Yes/No)': item.isSpicy ? 'Yes' : 'No',
    'In Stock (Yes/No)': item.inStock ? 'Yes' : 'No',
    'Description': item.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu');
  XLSX.writeFile(workbook, filename);
};

export const exportMenuItemsToCSV = (items: MenuItem[], categories: Category[], filename: string = 'Hotel_Menu_Catalog.csv') => {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const data = items.map(item => ({
    'Item Code': item.code,
    'Dish Name': item.name,
    'Category': catMap.get(item.categoryId) || 'Uncategorized',
    'Base Price': item.price,
    'GST Rate': item.gstRate,
    'HSN Code': item.hsnCode || '2106',
    'Veg': item.isVeg ? 'Yes' : 'No',
    'Spicy': item.isSpicy ? 'Yes' : 'No',
    'In Stock': item.inStock ? 'Yes' : 'No',
    'Description': item.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Import menu items from XLSX or CSV file
export const parseMenuSpreadsheet = async (
  file: File, 
  categories: Category[]
): Promise<MenuItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const categoryNameToId = new Map(
          categories.map(c => [c.name.toLowerCase().trim(), c.id])
        );

        const defaultCatId = categories[0]?.id || 'cat_all';

        const parsedItems: MenuItem[] = jsonRows.map((row, index) => {
          const name = row['Dish Name'] || row['Item Name'] || row['Name'] || `Item ${index + 1}`;
          const code = row['Item Code'] || row['Code'] || `IT-${100 + index}`;
          const price = Number(row['Base Price (₹)'] || row['Base Price'] || row['Price'] || 100);
          const gstRate = Number(row['GST Rate (%)'] || row['GST Rate'] || row['GST'] || 5);
          const hsnCode = String(row['HSN Code'] || row['HSN'] || '2106');
          const categoryName = String(row['Category'] || '').toLowerCase().trim();
          const categoryId = categoryNameToId.get(categoryName) || defaultCatId;

          const vegVal = String(row['Veg (Yes/No)'] || row['Veg'] || 'yes').toLowerCase();
          const isVeg = vegVal === 'yes' || vegVal === 'true' || vegVal === '1';

          const spicyVal = String(row['Spicy (Yes/No)'] || row['Spicy'] || 'no').toLowerCase();
          const isSpicy = spicyVal === 'yes' || spicyVal === 'true' || spicyVal === '1';

          const stockVal = String(row['In Stock (Yes/No)'] || row['In Stock'] || 'yes').toLowerCase();
          const inStock = stockVal !== 'no' && stockVal !== 'false' && stockVal !== '0';

          const description = row['Description'] || '';

          return {
            id: `item_imp_${Date.now()}_${index}`,
            code,
            name,
            categoryId,
            price,
            gstRate,
            hsnCode,
            isVeg,
            isSpicy,
            inStock,
            description,
          };
        });

        resolve(parsedItems);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
