export type Role = 'admin' | 'manager' | 'cashier';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'room_tab' | 'split';

export type BillStatus = 'paid' | 'pending' | 'cancelled' | 'refunded';

export type OrderType = 'dine_in' | 'takeaway' | 'room_service' | 'counter';

export type GSTMode = 'inclusive' | 'exclusive';

export type TableStatus = 'available' | 'occupied' | 'billed';

export type RoomStatus = 'available' | 'occupied';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  pin: string;
  password?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  price: number;
  gstRate: number; // e.g. 5, 12, 18
  hsnCode?: string;
  isVeg: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  inStock: boolean;
  imageUrl?: string;
  description?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  gstRate: number;
  hsnCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  notes?: string;
  imageUrl?: string;
}

export interface Table {
  id: string;
  number: string; // T1 to T20
  capacity: number;
  status: TableStatus;
  activeBillId?: string;
  currentGuests?: number;
  currentAmount?: number;
  orderStartedAt?: string;
  orderItems?: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface Room {
  id: string;
  number: string; // 101 to 110
  type: string; // Deluxe, Suite, Executive
  status: RoomStatus;
  guestName?: string;
  guestPhone?: string;
  activeBillId?: string;
  currentAmount?: number;
  checkInDate?: string;
  orderItems?: OrderItem[];
}

export interface KOTItem {
  name: string;
  code: string;
  quantity: number;
  notes?: string;
}

export interface KOT {
  id: string;
  kotNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  roomNumber?: string;
  waiterName?: string;
  items: KOTItem[];
  specialInstructions?: string;
  createdAt: string;
  status: 'pending' | 'preparing' | 'completed';
}

export interface SplitPaymentDetails {
  cash: number;
  upi: number;
  card: number;
  roomTab?: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  roomNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  itemDiscountsTotal?: number;
  billDiscountPercent?: number;
  billDiscountAmount: number;
  serviceChargePercent?: number;
  serviceChargeAmount?: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  roundingOff?: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitPayment?: SplitPaymentDetails;
  paymentReference?: string;
  upiTransactionId?: string;
  status: BillStatus;
  cashierName: string;
  gstMode: GSTMode;
  notes?: string;
  createdAt: string;
  settledAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface HotelSettings {
  hotelName: string;
  tagline: string;
  addressLine1: string;
  city: string;
  state?: string;
  pincode?: string;
  phone: string;
  email: string;
  gstin: string;
  fssaiNumber: string;
  currencySymbol: string;
  upiId: string;
  upiPayeeName: string;
  gstMode: GSTMode;
  defaultGstRate: number;
  serviceChargeRate: number; // e.g. 0 or 5%
  thermalPaperWidth: '58mm' | '80mm';
  footerMessage: string;
  termsAndConditions: string;
  logoBase64?: string;
  lastBackupDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  billId?: string;
}
