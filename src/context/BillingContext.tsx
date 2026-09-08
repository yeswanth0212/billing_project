import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MenuItem, 
  Category, 
  HotelSettings, 
  Bill, 
  AuditLog, 
  OrderItem, 
  PaymentMethod,
  Table,
  Room,
  KOT,
  OrderType,
  GSTMode,
  SplitPaymentDetails
} from '../types';
import { Storage } from '../utils/storage';
import { playSound } from '../utils/helpers';
import { sendBillToWhatsApp, shareBillNative } from '../utils/whatsapp';
import { useAuth } from './AuthContext';
import { 
  DEFAULT_HOTEL_SETTINGS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_MENU_ITEMS, 
  DEFAULT_TABLES, 
  DEFAULT_ROOMS 
} from '../data/seedData';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ReceiptPrintFormat = '58mm' | '80mm' | 'a4' | 'a5' | 'kot';

interface BillingContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: Category[];
  menuItems: MenuItem[];
  settings: HotelSettings;
  bills: Bill[];
  auditLogs: AuditLog[];
  tables: Table[];
  rooms: Room[];
  kots: KOT[];
  
  // Active POS Order State
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  cart: OrderItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  kitchenInstructions: string;
  setKitchenInstructions: (text: string) => void;

  // Discounts & Tax configurations
  billDiscountPercent: number;
  setBillDiscountPercent: (pct: number) => void;
  billDiscountAmount: number;
  setBillDiscountAmount: (amt: number) => void;
  serviceChargeEnabled: boolean;
  setServiceChargeEnabled: (enabled: boolean) => void;
  gstMode: GSTMode;
  setGstMode: (mode: GSTMode) => void;

  // Cart operations
  addToCart: (item: MenuItem, qty?: number) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  updateCartNotes: (itemId: string, notes: string) => void;
  updateCartDiscount: (itemId: string, discountPct: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Totals
  subtotal: number;
  itemDiscountsTotal: number;
  calculatedDiscount: number;
  serviceChargeAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  roundingOff: number;
  grandTotal: number;

  // Table & Room Operations
  openTable: (table: Table, guests?: number, customer?: string, phone?: string) => Promise<void>;
  loadTableOrder: (table: Table) => void;
  holdOrderOnTable: () => Promise<boolean>;
  transferTable: (fromTableNumber: string, toTableNumber: string) => Promise<boolean>;
  mergeTables: (sourceTableNumber: string, targetTableNumber: string) => Promise<boolean>;
  loadRoomOrder: (room: Room) => void;
  holdOrderOnRoom: () => Promise<boolean>;

  // KOT
  generateKOT: (waiterName?: string) => Promise<KOT | null>;

  // Settle Bill & Refunds
  settleCurrentBill: (
    paymentMethod: PaymentMethod, 
    options?: { 
      paymentRef?: string; 
      splitDetails?: SplitPaymentDetails;
      cashTendered?: number;
    }
  ) => Promise<Bill | null>;
  cancelBill: (billId: string, reason: string) => Promise<boolean>;
  refundBill: (billId: string, reason: string) => Promise<boolean>;

  // Invoices & Printing Modals
  activeReceiptBill: Bill | null;
  activeKotReceipt: KOT | null;
  receiptFormat: ReceiptPrintFormat;
  setReceiptFormat: (format: ReceiptPrintFormat) => void;
  previewBill: (bill: Bill, format?: ReceiptPrintFormat) => void;
  previewKot: (kot: KOT) => void;
  closeReceiptModal: () => void;

  // Menu CRUD
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  bulkImportMenuItems: (items: MenuItem[]) => Promise<void>;

  // Settings & DB Management
  updateSettings: (newSettings: HotelSettings) => Promise<void>;
  downloadBackupJSON: () => Promise<void>;
  restoreDatabase: (jsonStr: string) => Promise<void>;
  clearAllDatabaseData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Toasts
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // WhatsApp & Sharing
  sendWhatsAppBill: (bill: Bill, customPhone?: string) => void;
  shareBill: (bill: Bill) => Promise<boolean>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('pos');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [settings, setSettings] = useState<HotelSettings>(DEFAULT_HOTEL_SETTINGS);
  const [bills, setBills] = useState<Bill[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tables, setTables] = useState<Table[]>(DEFAULT_TABLES);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [kots, setKots] = useState<KOT[]>([]);

  // POS Order State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(DEFAULT_TABLES[0]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [kitchenInstructions, setKitchenInstructions] = useState<string>('');

  // Discounts, Service Charge, GST
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [billDiscountAmount, setBillDiscountAmount] = useState<number>(0);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState<boolean>(false);
  const [gstMode, setGstMode] = useState<GSTMode>('exclusive');

  // Modals & Receipts
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);
  const [activeKotReceipt, setActiveKotReceipt] = useState<KOT | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<ReceiptPrintFormat>('80mm');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 't_' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshData = async () => {
    try {
      const [cats, items, stt, allBills, logs, tbls, rms, allKots] = await Promise.all([
        Storage.getCategories(),
        Storage.getMenuItems(),
        Storage.getSettings(),
        Storage.getBills(),
        Storage.getAuditLogs(),
        Storage.getTables(),
        Storage.getRooms(),
        Storage.getKOTs(),
      ]);

      if (cats && cats.length > 0) setCategories(cats);
      if (items && items.length > 0) setMenuItems(items);
      if (stt) {
        setSettings(stt);
        setGstMode(stt.gstMode || 'exclusive');
        setReceiptFormat(stt.thermalPaperWidth || '80mm');
      }
      if (allBills) setBills(allBills);
      if (logs) setAuditLogs(logs);
      if (tbls && tbls.length > 0) setTables(tbls);
      if (rms && rms.length > 0) setRooms(rms);
      if (allKots) setKots(allKots);
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
    }
  };

  useEffect(() => {
    Storage.init().then(() => {
      refreshData();
    });
  }, []);

  // Cart item management
  const addToCart = (item: MenuItem, qty: number = 1) => {
    if (!item.inStock) {
      showToast(`${item.name} is currently out of stock`, 'error');
      return;
    }
    playSound('beep');
    setCart(prev => {
      const idx = prev.findIndex(i => i.menuItemId === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += qty;
        return updated;
      } else {
        const newItem: OrderItem = {
          id: 'cart_' + Date.now() + Math.random().toString(36).substring(2, 5),
          menuItemId: item.id,
          name: item.name,
          code: item.code,
          price: item.price,
          quantity: qty,
          gstRate: item.gstRate || settings.defaultGstRate || 5,
          hsnCode: item.hsnCode,
          discountPercent: 0,
          discountAmount: 0,
          imageUrl: item.imageUrl,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === itemId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
    playSound('beep');
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(item => (item.id === itemId ? { ...item, notes } : item)));
  };

  const updateCartDiscount = (itemId: string, discountPct: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const discountAmount = Math.round((item.price * item.quantity * discountPct) / 100);
          return { ...item, discountPercent: discountPct, discountAmount };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    playSound('delete');
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setKitchenInstructions('');
    setBillDiscountPercent(0);
    setBillDiscountAmount(0);
    setServiceChargeEnabled(false);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemDiscountsTotal = cart.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
  
  const calculatedDiscount = billDiscountAmount > 0 
    ? billDiscountAmount 
    : (subtotal * billDiscountPercent) / 100;

  const totalDiscount = itemDiscountsTotal + calculatedDiscount;
  const netBeforeTax = Math.max(0, subtotal - totalDiscount);

  // Service charge
  const serviceChargeRate = serviceChargeEnabled ? (settings.serviceChargeRate || 5) : 0;
  const serviceChargeAmount = Math.round(((netBeforeTax * serviceChargeRate) / 100) * 100) / 100;

  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let totalGst = 0;
  let grandTotal = 0;
  let roundingOff = 0;

  if (gstMode === 'inclusive') {
    // Inclusive: item prices already include GST
    const baseWithService = netBeforeTax + serviceChargeAmount;
    // Avg GST calculation based on cart items
    const totalGstPortion = cart.reduce((acc, item) => {
      const rate = item.gstRate || 5;
      const itemNet = (item.price * item.quantity) - (item.discountAmount || 0);
      const taxPart = itemNet - (itemNet / (1 + rate / 100));
      return acc + taxPart;
    }, 0);

    totalGst = Math.round(totalGstPortion * 100) / 100;
    cgstAmount = Math.round((totalGst / 2) * 100) / 100;
    sgstAmount = Math.round((totalGst / 2) * 100) / 100;
    taxableAmount = Math.round((baseWithService - totalGst) * 100) / 100;
    
    const unroundedGrand = baseWithService;
    grandTotal = Math.round(unroundedGrand);
    roundingOff = Math.round((grandTotal - unroundedGrand) * 100) / 100;
  } else {
    // Exclusive: GST added on top of taxable amount
    taxableAmount = netBeforeTax + serviceChargeAmount;

    // Calculate individual item tax
    const rawGst = cart.reduce((acc, item) => {
      const rate = item.gstRate || 5;
      const itemNet = (item.price * item.quantity) - (item.discountAmount || 0);
      return acc + (itemNet * rate) / 100;
    }, 0);

    // Apply average rate to service charge as well
    const avgRate = cart.length > 0 
      ? cart.reduce((a, b) => a + (b.gstRate || 5), 0) / cart.length 
      : (settings.defaultGstRate || 5);
    const serviceTax = (serviceChargeAmount * avgRate) / 100;

    totalGst = Math.round((rawGst + serviceTax) * 100) / 100;
    cgstAmount = Math.round((totalGst / 2) * 100) / 100;
    sgstAmount = Math.round((totalGst / 2) * 100) / 100;

    const unroundedGrand = taxableAmount + totalGst;
    grandTotal = Math.round(unroundedGrand);
    roundingOff = Math.round((grandTotal - unroundedGrand) * 100) / 100;
  }

  // Table Management Actions
  const openTable = async (table: Table, guests: number = 2, custName?: string, phone?: string) => {
    const updatedTable: Table = {
      ...table,
      status: 'occupied',
      currentGuests: guests,
      customerName: custName || '',
      customerPhone: phone || '',
      orderStartedAt: new Date().toISOString(),
      orderItems: [],
      currentAmount: 0,
    };
    const updatedTables = tables.map(t => (t.id === table.id ? updatedTable : t));
    setTables(updatedTables);
    setSelectedTable(updatedTable);
    setOrderType('dine_in');
    await Storage.saveTable(updatedTable);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'TABLE_OPENED',
      details: `Table ${table.number} opened for ${guests} guests`,
    });
    showToast(`Table ${table.number} opened`, 'success');
  };

  const loadTableOrder = (table: Table) => {
    setSelectedTable(table);
    setOrderType('dine_in');
    if (table.orderItems && table.orderItems.length > 0) {
      setCart([...table.orderItems]);
    } else {
      setCart([]);
    }
    setCustomerName(table.customerName || '');
    setCustomerPhone(table.customerPhone || '');
    setActiveTab('pos');
    showToast(`Loaded Table ${table.number}`, 'info');
  };

  const holdOrderOnTable = async (): Promise<boolean> => {
    if (!selectedTable) {
      showToast('Please select a Table first for Dine-In order', 'error');
      return false;
    }
    if (cart.length === 0) {
      showToast('No items in cart to save on table', 'error');
      return false;
    }

    const updatedTable: Table = {
      ...selectedTable,
      status: 'occupied',
      orderItems: [...cart],
      currentAmount: grandTotal,
      customerName: customerName || selectedTable.customerName,
      customerPhone: customerPhone || selectedTable.customerPhone,
      notes: kitchenInstructions,
    };

    const updatedTables = tables.map(t => (t.id === selectedTable.id ? updatedTable : t));
    setTables(updatedTables);
    setSelectedTable(updatedTable);
    await Storage.saveTable(updatedTable);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'ORDER_HOLD',
      details: `Hold/Saved order for Table ${selectedTable.number} (${cart.length} items, ₹${grandTotal})`,
    });

    playSound('success');
    showToast(`Order held on Table ${selectedTable.number}`, 'success');
    return true;
  };

  const transferTable = async (fromTableNumber: string, toTableNumber: string): Promise<boolean> => {
    const source = tables.find(t => t.number === fromTableNumber);
    const target = tables.find(t => t.number === toTableNumber);

    if (!source || !target) {
      showToast('Invalid source or target table', 'error');
      return false;
    }
    if (target.status !== 'available') {
      showToast(`Target Table ${toTableNumber} is currently occupied!`, 'error');
      return false;
    }

    const updatedTarget: Table = {
      ...target,
      status: source.status,
      currentGuests: source.currentGuests,
      customerName: source.customerName,
      customerPhone: source.customerPhone,
      orderStartedAt: source.orderStartedAt,
      orderItems: source.orderItems || [],
      currentAmount: source.currentAmount,
      notes: source.notes,
    };

    const updatedSource: Table = {
      ...source,
      status: 'available',
      currentGuests: undefined,
      customerName: undefined,
      customerPhone: undefined,
      orderStartedAt: undefined,
      orderItems: [],
      currentAmount: 0,
      notes: undefined,
    };

    const updatedTables = tables.map(t => {
      if (t.id === source.id) return updatedSource;
      if (t.id === target.id) return updatedTarget;
      return t;
    });

    setTables(updatedTables);
    if (selectedTable?.id === source.id) {
      setSelectedTable(updatedTarget);
    }

    await Storage.saveTable(updatedSource);
    await Storage.saveTable(updatedTarget);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'TABLE_TRANSFER',
      details: `Transferred orders from Table ${fromTableNumber} to Table ${toTableNumber}`,
    });

    showToast(`Successfully transferred Table ${fromTableNumber} to ${toTableNumber}`, 'success');
    return true;
  };

  const mergeTables = async (sourceTableNumber: string, targetTableNumber: string): Promise<boolean> => {
    const source = tables.find(t => t.number === sourceTableNumber);
    const target = tables.find(t => t.number === targetTableNumber);

    if (!source || !target || source.id === target.id) {
      showToast('Cannot merge the same table', 'error');
      return false;
    }

    const mergedItems = [...(target.orderItems || []), ...(source.orderItems || [])];
    const newAmount = (target.currentAmount || 0) + (source.currentAmount || 0);

    const updatedTarget: Table = {
      ...target,
      status: 'occupied',
      orderItems: mergedItems,
      currentAmount: newAmount,
    };

    const updatedSource: Table = {
      ...source,
      status: 'available',
      orderItems: [],
      currentAmount: 0,
      customerName: undefined,
      customerPhone: undefined,
    };

    const updatedTables = tables.map(t => {
      if (t.id === source.id) return updatedSource;
      if (t.id === target.id) return updatedTarget;
      return t;
    });

    setTables(updatedTables);
    await Storage.saveTable(updatedSource);
    await Storage.saveTable(updatedTarget);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'TABLE_MERGE',
      details: `Merged Table ${sourceTableNumber} into Table ${targetTableNumber}`,
    });

    showToast(`Merged Table ${sourceTableNumber} into ${targetTableNumber}`, 'success');
    return true;
  };

  // Room Service Management
  const loadRoomOrder = (room: Room) => {
    setSelectedRoom(room);
    setOrderType('room_service');
    if (room.orderItems && room.orderItems.length > 0) {
      setCart([...room.orderItems]);
    } else {
      setCart([]);
    }
    setCustomerName(room.guestName || '');
    setCustomerPhone(room.guestPhone || '');
    setActiveTab('pos');
    showToast(`Loaded Room ${room.number}`, 'info');
  };

  const holdOrderOnRoom = async (): Promise<boolean> => {
    if (!selectedRoom) {
      showToast('Please select a Room first for Room Service', 'error');
      return false;
    }
    if (cart.length === 0) {
      showToast('No items in cart', 'error');
      return false;
    }

    const updatedRoom: Room = {
      ...selectedRoom,
      status: 'occupied',
      guestName: customerName || selectedRoom.guestName || 'In-House Guest',
      guestPhone: customerPhone || selectedRoom.guestPhone,
      orderItems: [...cart],
      currentAmount: grandTotal,
    };

    const updatedRooms = rooms.map(r => (r.id === selectedRoom.id ? updatedRoom : r));
    setRooms(updatedRooms);
    setSelectedRoom(updatedRoom);
    await Storage.saveRoom(updatedRoom);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'ROOM_SERVICE_HOLD',
      details: `Saved Room Service order for Room ${selectedRoom.number} (₹${grandTotal})`,
    });

    playSound('success');
    showToast(`Order held for Room ${selectedRoom.number}`, 'success');
    return true;
  };

  // Kitchen Order Ticket (KOT)
  const generateKOT = async (waiterName?: string): Promise<KOT | null> => {
    if (cart.length === 0) {
      showToast('Cart is empty. Add items to generate KOT.', 'error');
      return null;
    }

    const kotNumber = Storage.getNextKotNumber(kots.length);
    const newKot: KOT = {
      id: 'kot_' + Date.now(),
      kotNumber,
      orderType,
      tableNumber: orderType === 'dine_in' ? selectedTable?.number : undefined,
      roomNumber: orderType === 'room_service' ? selectedRoom?.number : undefined,
      waiterName: waiterName || currentUser?.name || 'Front Staff',
      items: cart.map(i => ({
        name: i.name,
        code: i.code,
        quantity: i.quantity,
        notes: i.notes,
      })),
      specialInstructions: kitchenInstructions,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedKots = [newKot, ...kots];
    setKots(updatedKots);
    await Storage.saveKOT(newKot);

    // If on table, mark as occupied
    if (orderType === 'dine_in' && selectedTable) {
      const updatedTable: Table = {
        ...selectedTable,
        status: 'occupied',
        orderItems: [...cart],
        currentAmount: grandTotal,
      };
      setTables(prev => prev.map(t => (t.id === selectedTable.id ? updatedTable : t)));
      await Storage.saveTable(updatedTable);
    }

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Staff',
      action: 'KOT_GENERATED',
      details: `Generated ${kotNumber} for ${orderType.toUpperCase()} (${newKot.tableNumber || newKot.roomNumber || 'Counter'})`,
    });

    playSound('success');
    showToast(`${kotNumber} generated for Kitchen!`, 'success');
    setActiveKotReceipt(newKot);
    return newKot;
  };

  // Settle Bill
  const settleCurrentBill = async (
    paymentMethod: PaymentMethod,
    options?: {
      paymentRef?: string;
      splitDetails?: SplitPaymentDetails;
      cashTendered?: number;
    }
  ): Promise<Bill | null> => {
    if (cart.length === 0) {
      showToast('No items in order to settle', 'error');
      return null;
    }

    const billNumber = Storage.getNextBillNumber(bills.length);
    const newBill: Bill = {
      id: 'b_' + Date.now(),
      billNumber,
      orderType,
      tableNumber: orderType === 'dine_in' ? selectedTable?.number : undefined,
      roomNumber: orderType === 'room_service' ? selectedRoom?.number : undefined,
      customerName: customerName.trim() || (orderType === 'dine_in' ? `Guest (${selectedTable?.number || 'T'})` : 'Walk-in Customer'),
      customerPhone: customerPhone.trim(),
      items: [...cart],
      subtotal,
      itemDiscountsTotal,
      billDiscountPercent,
      billDiscountAmount: calculatedDiscount,
      serviceChargePercent: serviceChargeEnabled ? settings.serviceChargeRate : 0,
      serviceChargeAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      totalGst,
      roundingOff,
      grandTotal,
      paymentMethod,
      splitPayment: options?.splitDetails,
      paymentReference: options?.paymentRef,
      status: 'paid',
      cashierName: currentUser?.name || 'Cashier',
      gstMode,
      notes: kitchenInstructions,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    };

    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    await Storage.saveBill(newBill);

    // Free table if dine-in
    if (orderType === 'dine_in' && selectedTable) {
      const freeTable: Table = {
        ...selectedTable,
        status: 'available',
        currentGuests: undefined,
        currentAmount: 0,
        customerName: undefined,
        customerPhone: undefined,
        orderStartedAt: undefined,
        orderItems: [],
        notes: undefined,
      };
      setTables(prev => prev.map(t => (t.id === selectedTable.id ? freeTable : t)));
      await Storage.saveTable(freeTable);
    }

    // Free room if room service
    if (orderType === 'room_service' && selectedRoom) {
      const updatedRoom: Room = {
        ...selectedRoom,
        orderItems: [],
        currentAmount: 0,
      };
      setRooms(prev => prev.map(r => (r.id === selectedRoom.id ? updatedRoom : r)));
      await Storage.saveRoom(updatedRoom);
    }

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Cashier',
      action: 'BILL_SETTLED',
      details: `Bill ${newBill.billNumber} settled for ₹${newBill.grandTotal} via ${paymentMethod.toUpperCase()}`,
      billId: newBill.id,
    });

    playSound('success');
    showToast(`Bill ${billNumber} Settled Successfully!`, 'success');
    setActiveReceiptBill(newBill);
    clearCart();

    // Directly send bill to customer's WhatsApp if phone number is provided
    const rawDigits = (newBill.customerPhone || '').replace(/\D/g, '');
    if (rawDigits.length >= 10) {
      setTimeout(() => {
        sendBillToWhatsApp(newBill, settings);
      }, 400);
      showToast(`Bill sent to WhatsApp (${newBill.customerPhone})`, 'info');
    }

    return newBill;
  };

  // Cancel Bill with reason
  const cancelBill = async (billId: string, reason: string): Promise<boolean> => {
    const target = bills.find(b => b.id === billId);
    if (!target) return false;

    const updatedBill: Bill = {
      ...target,
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy: currentUser?.name || 'Admin',
    };

    const updatedBills = bills.map(b => (b.id === billId ? updatedBill : b));
    setBills(updatedBills);
    await Storage.saveBill(updatedBill);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'BILL_CANCELLED',
      details: `Bill ${target.billNumber} cancelled by ${currentUser?.name}. Reason: ${reason}`,
      billId: target.id,
    });

    showToast(`Bill ${target.billNumber} cancelled`, 'info');
    return true;
  };

  // Refund Bill
  const refundBill = async (billId: string, reason: string): Promise<boolean> => {
    const target = bills.find(b => b.id === billId);
    if (!target) return false;

    const updatedBill: Bill = {
      ...target,
      status: 'refunded',
      cancellationReason: `REFUND: ${reason}`,
      cancelledAt: new Date().toISOString(),
      cancelledBy: currentUser?.name || 'Admin',
    };

    const updatedBills = bills.map(b => (b.id === billId ? updatedBill : b));
    setBills(updatedBills);
    await Storage.saveBill(updatedBill);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'BILL_REFUNDED',
      details: `Refunded ₹${target.grandTotal} for Bill ${target.billNumber}. Reason: ${reason}`,
      billId: target.id,
    });

    showToast(`Bill ${target.billNumber} Refunded`, 'info');
    return true;
  };

  const previewBill = (bill: Bill, format?: ReceiptPrintFormat) => {
    setActiveReceiptBill(bill);
    if (format) setReceiptFormat(format);
  };

  const previewKot = (kot: KOT) => {
    setActiveKotReceipt(kot);
    setReceiptFormat('kot');
  };

  const closeReceiptModal = () => {
    setActiveReceiptBill(null);
    setActiveKotReceipt(null);
  };

  // Menu CRUD
  const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...itemData, id: 'item_' + Date.now() };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    await Storage.saveMenuItem(newItem);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'MENU_ITEM_ADDED',
      details: `Added new dish: ${newItem.name} (${newItem.code}) for ₹${newItem.price}`,
    });

    showToast(`Added ${newItem.name}`, 'success');
  };

  const updateMenuItem = async (item: MenuItem) => {
    const updated = menuItems.map(m => (m.id === item.id ? item : m));
    setMenuItems(updated);
    await Storage.saveMenuItem(item);

    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'MENU_ITEM_EDITED',
      details: `Updated dish: ${item.name} (Price: ₹${item.price}, Stock: ${item.inStock ? 'Yes' : 'No'})`,
    });

    showToast(`Updated ${item.name}`, 'success');
  };

  const deleteMenuItem = async (id: string) => {
    const target = menuItems.find(m => m.id === id);
    const updated = menuItems.filter(m => m.id !== id);
    setMenuItems(updated);
    await Storage.deleteMenuItem(id);

    if (target) {
      await Storage.addAuditLog({
        userId: currentUser?.id || 'usr',
        userName: currentUser?.name || 'Admin',
        action: 'MENU_ITEM_DELETED',
        details: `Deleted dish: ${target.name} (${target.code})`,
      });
    }

    showToast('Menu item deleted', 'info');
  };

  const bulkImportMenuItems = async (importedItems: MenuItem[]) => {
    setMenuItems(importedItems);
    await Storage.saveBulkMenuItems(importedItems);
    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'MENU_BULK_IMPORT',
      details: `Bulk imported ${importedItems.length} menu items from spreadsheet`,
    });
    showToast(`Successfully imported ${importedItems.length} dishes`, 'success');
  };

  // Settings & DB Safety
  const updateSettings = async (newSettings: HotelSettings) => {
    setSettings(newSettings);
    await Storage.saveSettings(newSettings);
    await Storage.addAuditLog({
      userId: currentUser?.id || 'usr',
      userName: currentUser?.name || 'Admin',
      action: 'SETTINGS_CHANGED',
      details: 'Updated Hotel Profile and Billing Parameters in IndexedDB',
    });
    showToast('Settings saved to local IndexedDB', 'success');
  };

  const downloadBackupJSON = async () => {
    await Storage.downloadBackupJSON();
    showToast('Full JSON backup downloaded', 'success');
    refreshData();
  };

  const restoreDatabase = async (jsonStr: string) => {
    await Storage.restoreFromJSON(jsonStr);
    await refreshData();
    showToast('Complete Database restored successfully!', 'success');
  };

  const clearAllDatabaseData = async () => {
    await Storage.clearAllData();
    await refreshData();
    clearCart();
    showToast('All data cleared and reset to factory defaults', 'info');
  };

  const sendWhatsAppBill = (bill: Bill, customPhone?: string) => {
    const res = sendBillToWhatsApp(bill, settings, customPhone);
    if (res.success) {
      showToast('Opening WhatsApp with invoice...', 'success');
    } else {
      showToast('Failed to open WhatsApp: ' + (res.error || 'Unknown error'), 'error');
    }
  };

  const shareBill = async (bill: Bill): Promise<boolean> => {
    const success = await shareBillNative(bill, settings);
    if (success) {
      showToast('Bill shared successfully', 'success');
    }
    return success;
  };

  return (
    <BillingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        categories,
        menuItems,
        settings,
        bills,
        auditLogs,
        tables,
        rooms,
        kots,
        orderType,
        setOrderType,
        selectedTable,
        setSelectedTable,
        selectedRoom,
        setSelectedRoom,
        cart,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        kitchenInstructions,
        setKitchenInstructions,
        billDiscountPercent,
        setBillDiscountPercent,
        billDiscountAmount,
        setBillDiscountAmount,
        serviceChargeEnabled,
        setServiceChargeEnabled,
        gstMode,
        setGstMode,
        addToCart,
        updateCartQty,
        updateCartNotes,
        updateCartDiscount,
        removeFromCart,
        clearCart,
        subtotal,
        itemDiscountsTotal,
        calculatedDiscount,
        serviceChargeAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        totalGst,
        roundingOff,
        grandTotal,
        openTable,
        loadTableOrder,
        holdOrderOnTable,
        transferTable,
        mergeTables,
        loadRoomOrder,
        holdOrderOnRoom,
        generateKOT,
        settleCurrentBill,
        cancelBill,
        refundBill,
        activeReceiptBill,
        activeKotReceipt,
        receiptFormat,
        setReceiptFormat,
        previewBill,
        previewKot,
        closeReceiptModal,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        bulkImportMenuItems,
        updateSettings,
        downloadBackupJSON,
        restoreDatabase,
        clearAllDatabaseData,
        refreshData,
        toasts,
        showToast,
        dismissToast,
        sendWhatsAppBill,
        shareBill,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be within BillingProvider');
  return ctx;
};
