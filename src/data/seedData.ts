import { Category, MenuItem, User, HotelSettings, Bill, AuditLog, Table, Room, KOT } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'General Manager (Admin)',
    role: 'admin',
    pin: '1234',
    password: 'admin123',
    phone: '+91 98765 00001',
    isActive: true,
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 'usr_mgr',
    username: 'manager',
    name: 'Operations Manager',
    role: 'manager',
    pin: '2345',
    password: 'mgr123',
    phone: '+91 98765 00002',
    isActive: true,
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 'usr_cashier',
    username: 'cashier',
    name: 'Frontdesk Cashier',
    role: 'cashier',
    pin: '1111',
    password: 'cash123',
    phone: '+91 98765 00003',
    isActive: true,
    createdAt: '2026-01-01T09:00:00.000Z',
  },
];

export const DEFAULT_HOTEL_SETTINGS: HotelSettings = {
  hotelName: 'GRAND ROYAL PALACE HOTEL & RESTAURANT',
  tagline: 'Luxury Dining & Premium Hospitality',
  addressLine1: 'Plot 42, Silicon Heights, Financial District',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500081',
  phone: '+91 98765 43210',
  email: 'billing@grandroyalpalace.com',
  gstin: '36AABCU9603R1ZM',
  fssaiNumber: '13621014000342',
  currencySymbol: '₹',
  upiId: 'grandroyal@icici',
  upiPayeeName: 'Grand Royal Palace Hotel',
  gstMode: 'exclusive',
  defaultGstRate: 5,
  serviceChargeRate: 5,
  thermalPaperWidth: '80mm',
  footerMessage: 'Thank you for choosing Grand Royal Palace! Have a wonderful day.',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Incase of billing disputes, please present original receipt within 24 hours.\n3. Applicable GST charged as per statutory guidelines.',
  lastBackupDate: new Date().toISOString().slice(0, 10),
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_all', name: 'All Menu', icon: 'Sparkles', bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', displayOrder: 1 },
  { id: 'cat_starters', name: 'Starters & Soups', icon: 'Utensils', bgColor: 'bg-amber-100 text-amber-800 border-amber-300', displayOrder: 2 },
  { id: 'cat_main', name: 'Main Course', icon: 'Soup', bgColor: 'bg-orange-100 text-orange-800 border-orange-300', displayOrder: 3 },
  { id: 'cat_biryani', name: 'Biryani & Rice', icon: 'Flame', bgColor: 'bg-rose-100 text-rose-800 border-rose-300', displayOrder: 4 },
  { id: 'cat_tandoor', name: 'Tandoori & Breads', icon: 'Wheat', bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-300', displayOrder: 5 },
  { id: 'cat_drinks', name: 'Beverages & Mocktails', icon: 'GlassWater', bgColor: 'bg-teal-100 text-teal-800 border-teal-300', displayOrder: 6 },
  { id: 'cat_desserts', name: 'Desserts & Shakes', icon: 'IceCream', bgColor: 'bg-pink-100 text-pink-800 border-pink-300', displayOrder: 7 },
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Starters
  { id: 'm1', code: 'STR-01', name: 'Paneer Tikka Angara', categoryId: 'cat_starters', price: 290, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: true, isPopular: true, inStock: true, description: 'Cottage cheese marinated in fiery spices and grilled in clay oven' },
  { id: 'm2', code: 'STR-02', name: 'Murgh Malai Tikka', categoryId: 'cat_starters', price: 340, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: false, isPopular: true, inStock: true, description: 'Succulent chicken morsels infused with cream, cheese, and cardamom' },
  { id: 'm3', code: 'STR-03', name: 'Crispy Corn Salt & Pepper', categoryId: 'cat_starters', price: 210, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, inStock: true, description: 'Golden American corn tossed with scallions and crushed pepper' },
  { id: 'm4', code: 'STR-04', name: 'Apollo Fish Tikka', categoryId: 'cat_starters', price: 380, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: true, inStock: true, description: 'Fresh boneless fish fillets spiced with southern curry leaves and red chili' },

  // Main Course
  { id: 'm5', code: 'MC-01', name: 'Paneer Butter Masala', categoryId: 'cat_main', price: 320, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Rich tomato cashew makhani gravy enriched with fresh butter' },
  { id: 'm6', code: 'MC-02', name: 'Dal Makhani Bukhara', categoryId: 'cat_main', price: 260, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Black lentils slow cooked overnight on charcoal embers' },
  { id: 'm7', code: 'MC-03', name: 'Butter Chicken Grand Royal', categoryId: 'cat_main', price: 390, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: false, isPopular: true, inStock: true, description: 'Charcoal grilled tandoori chicken cooked in silky tomato velvet gravy' },
  { id: 'm8', code: 'MC-04', name: 'Kadai Murgh Special', categoryId: 'cat_main', price: 370, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: true, inStock: true, description: 'Chicken cooked with bell peppers, crushed coriander seeds and dry chili' },

  // Biryani & Rice
  { id: 'm9', code: 'BR-01', name: 'Hyderabadi Dum Chicken Biryani', categoryId: 'cat_biryani', price: 360, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: true, isPopular: true, inStock: true, description: 'Aromatic long grain basmati rice cooked with marinated chicken & saffron' },
  { id: 'm10', code: 'BR-02', name: 'Royal Awadhi Mutton Biryani', categoryId: 'cat_biryani', price: 460, gstRate: 5, hsnCode: '2106', isVeg: false, isSpicy: true, isPopular: true, inStock: true, description: 'Tender baby mutton pieces dum-cooked with fragrant royal spices' },
  { id: 'm11', code: 'BR-03', name: 'Subz Dum Handi Biryani', categoryId: 'cat_biryani', price: 280, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, inStock: true, description: 'Farm garden vegetables & basmati rice simmered in clay handi' },
  { id: 'm12', code: 'BR-04', name: 'Jeera Ghee Rice', categoryId: 'cat_biryani', price: 190, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, inStock: true, description: 'Fragrant basmati tempered with royal cumin seeds and pure desi ghee' },

  // Tandoor & Breads
  { id: 'm13', code: 'TB-01', name: 'Butter Garlic Naan', categoryId: 'cat_tandoor', price: 75, gstRate: 5, hsnCode: '1905', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Refined flour leavened bread brushed with minced garlic and butter' },
  { id: 'm14', code: 'TB-02', name: 'Cheese Chilly Naan', categoryId: 'cat_tandoor', price: 95, gstRate: 5, hsnCode: '1905', isVeg: true, isSpicy: true, inStock: true, description: 'Stuffed with mozzarella cheese, green chilies, and coriander' },
  { id: 'm15', code: 'TB-03', name: 'Tandoori Roti (Butter)', categoryId: 'cat_tandoor', price: 45, gstRate: 5, hsnCode: '1905', isVeg: true, isSpicy: false, inStock: true, description: 'Whole wheat flour flatbread freshly baked in tandoor' },

  // Beverages
  { id: 'm16', code: 'BV-01', name: 'Fresh Mint Lime Mojito', categoryId: 'cat_drinks', price: 140, gstRate: 12, hsnCode: '2202', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Crushed garden mint, freshly squeezed lime, cane syrup, club soda' },
  { id: 'm17', code: 'BV-02', name: 'Royal Mango Mastani', categoryId: 'cat_drinks', price: 180, gstRate: 12, hsnCode: '2202', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Alphonso mango shake topped with vanilla ice cream and dry fruits' },
  { id: 'm18', code: 'BV-03', name: 'Blue Island Curacao Fizz', categoryId: 'cat_drinks', price: 160, gstRate: 12, hsnCode: '2202', isVeg: true, isSpicy: false, inStock: true, description: 'Zesty curacao mocktail with lemon twists and crushed ice' },

  // Desserts
  { id: 'm19', code: 'DS-01', name: 'Sizzling Brownie with Ice Cream', categoryId: 'cat_desserts', price: 220, gstRate: 18, hsnCode: '1905', isVeg: true, isSpicy: false, isPopular: true, inStock: true, description: 'Warm walnut fudge brownie on hot cast iron sizzler with dark fudge sauce' },
  { id: 'm20', code: 'DS-02', name: 'Kesari Shahi Gulab Jamun (2 Pcs)', categoryId: 'cat_desserts', price: 140, gstRate: 5, hsnCode: '2106', isVeg: true, isSpicy: false, inStock: true, description: 'Mawa dumplings soaked in saffron and cardamom scented warm syrup' },
];

export const DEFAULT_TABLES: Table[] = Array.from({ length: 20 }, (_, idx) => {
  const num = idx + 1;
  const tableNo = `T${num}`;
  const capacity = num <= 8 ? 4 : num <= 14 ? 6 : num <= 18 ? 2 : 8;

  // Make T3 occupied by default as realistic seed data
  if (num === 3) {
    return {
      id: `tbl_${num}`,
      number: tableNo,
      capacity,
      status: 'occupied',
      currentGuests: 3,
      currentAmount: 970,
      customerName: 'Rahul Verma',
      customerPhone: '9876543210',
      orderStartedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      orderItems: [
        { id: 'item_1', menuItemId: 'm1', name: 'Paneer Tikka Angara', code: 'STR-01', price: 290, quantity: 1, gstRate: 5 },
        { id: 'item_2', menuItemId: 'm9', name: 'Hyderabadi Dum Chicken Biryani', code: 'BR-01', price: 360, quantity: 1, gstRate: 5 },
        { id: 'item_3', menuItemId: 'm16', name: 'Fresh Mint Lime Mojito', code: 'BV-01', price: 140, quantity: 2, gstRate: 12 },
      ]
    };
  }

  // Make T7 billed (awaiting payment)
  if (num === 7) {
    return {
      id: `tbl_${num}`,
      number: tableNo,
      capacity,
      status: 'billed',
      currentGuests: 2,
      currentAmount: 640,
      customerName: 'Sneha Patel',
      customerPhone: '9812345678',
      orderStartedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      orderItems: [
        { id: 'item_4', menuItemId: 'm5', name: 'Paneer Butter Masala', code: 'MC-01', price: 320, quantity: 1, gstRate: 5 },
        { id: 'item_5', menuItemId: 'm13', name: 'Butter Garlic Naan', code: 'TB-01', price: 75, quantity: 4, gstRate: 5 },
      ]
    };
  }

  return {
    id: `tbl_${num}`,
    number: tableNo,
    capacity,
    status: 'available',
  };
});

export const DEFAULT_ROOMS: Room[] = Array.from({ length: 10 }, (_, idx) => {
  const roomNumber = String(101 + idx);
  const type = idx < 4 ? 'Deluxe Room' : idx < 8 ? 'Executive Suite' : 'Presidential Suite';

  if (roomNumber === '104') {
    return {
      id: `room_${roomNumber}`,
      number: roomNumber,
      type,
      status: 'occupied',
      guestName: 'Vikram Malhotra',
      guestPhone: '9988776655',
      checkInDate: '2026-09-05',
      currentAmount: 430,
      orderItems: [
        { id: 'r_item1', menuItemId: 'm7', name: 'Butter Chicken Grand Royal', code: 'MC-03', price: 390, quantity: 1, gstRate: 5 },
        { id: 'r_item2', menuItemId: 'm15', name: 'Tandoori Roti (Butter)', code: 'TB-03', price: 45, quantity: 2, gstRate: 5 },
      ]
    };
  }

  return {
    id: `room_${roomNumber}`,
    number: roomNumber,
    type,
    status: 'available',
  };
});

export const DEFAULT_KOTS: KOT[] = [
  {
    id: 'kot_1',
    kotNumber: 'KOT-1001',
    orderType: 'dine_in',
    tableNumber: 'T3',
    waiterName: 'Ramesh K',
    items: [
      { name: 'Paneer Tikka Angara', code: 'STR-01', quantity: 1, notes: 'Make extra crispy' },
      { name: 'Hyderabadi Dum Chicken Biryani', code: 'BR-01', quantity: 1, notes: 'Medium spicy' },
      { name: 'Fresh Mint Lime Mojito', code: 'BV-01', quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: 'preparing',
  },
  {
    id: 'kot_2',
    kotNumber: 'KOT-1002',
    orderType: 'room_service',
    roomNumber: '104',
    waiterName: 'Sunil M',
    items: [
      { name: 'Butter Chicken Grand Royal', code: 'MC-03', quantity: 1 },
      { name: 'Tandoori Roti (Butter)', code: 'TB-03', quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'completed',
  }
];

export const DEFAULT_BILLS: Bill[] = [
  {
    id: 'bill_001',
    billNumber: 'GRP-20260906-0001',
    orderType: 'dine_in',
    tableNumber: 'T1',
    customerName: 'Aarav Mehta',
    customerPhone: '9848012345',
    items: [
      { id: 'it1', menuItemId: 'm1', name: 'Paneer Tikka Angara', code: 'STR-01', price: 290, quantity: 1, gstRate: 5 },
      { id: 'it2', menuItemId: 'm5', name: 'Paneer Butter Masala', code: 'MC-01', price: 320, quantity: 1, gstRate: 5 },
      { id: 'it3', menuItemId: 'm13', name: 'Butter Garlic Naan', code: 'TB-01', price: 75, quantity: 2, gstRate: 5 },
      { id: 'it4', menuItemId: 'm16', name: 'Fresh Mint Lime Mojito', code: 'BV-01', price: 140, quantity: 2, gstRate: 12 },
    ],
    subtotal: 1040,
    billDiscountAmount: 50,
    serviceChargePercent: 5,
    serviceChargeAmount: 49.5,
    taxableAmount: 1039.5,
    cgstAmount: 31.18,
    sgstAmount: 31.18,
    totalGst: 62.36,
    grandTotal: 1102,
    paymentMethod: 'upi',
    paymentReference: 'UPI-TXN-984321',
    status: 'paid',
    cashierName: 'Frontdesk Cashier',
    gstMode: 'exclusive',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill_002',
    billNumber: 'GRP-20260906-0002',
    orderType: 'takeaway',
    customerName: 'Priya Sharma',
    customerPhone: '9703456789',
    items: [
      { id: 'it5', menuItemId: 'm9', name: 'Hyderabadi Dum Chicken Biryani', code: 'BR-01', price: 360, quantity: 2, gstRate: 5 },
      { id: 'it6', menuItemId: 'm7', name: 'Butter Chicken Grand Royal', code: 'MC-03', price: 390, quantity: 1, gstRate: 5 },
      { id: 'it7', menuItemId: 'm13', name: 'Butter Garlic Naan', code: 'TB-01', price: 75, quantity: 3, gstRate: 5 },
    ],
    subtotal: 1335,
    billDiscountAmount: 0,
    serviceChargeAmount: 0,
    taxableAmount: 1335,
    cgstAmount: 33.38,
    sgstAmount: 33.38,
    totalGst: 66.75,
    grandTotal: 1402,
    paymentMethod: 'cash',
    status: 'paid',
    cashierName: 'Frontdesk Cashier',
    gstMode: 'exclusive',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
  },
  {
    id: 'bill_003',
    billNumber: 'GRP-20260906-0003',
    orderType: 'room_service',
    roomNumber: '102',
    customerName: 'Rajesh Khanna',
    customerPhone: '9849011223',
    items: [
      { id: 'it8', menuItemId: 'm10', name: 'Royal Awadhi Mutton Biryani', code: 'BR-02', price: 460, quantity: 1, gstRate: 5 },
      { id: 'it9', menuItemId: 'm19', name: 'Sizzling Brownie with Ice Cream', code: 'DS-01', price: 220, quantity: 1, gstRate: 18 },
    ],
    subtotal: 680,
    billDiscountAmount: 0,
    serviceChargePercent: 5,
    serviceChargeAmount: 34,
    taxableAmount: 714,
    cgstAmount: 25.65,
    sgstAmount: 25.65,
    totalGst: 51.3,
    grandTotal: 765,
    paymentMethod: 'card',
    paymentReference: 'CARD-AUTH-654321',
    status: 'paid',
    cashierName: 'Operations Manager',
    gstMode: 'exclusive',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
    userId: 'usr_admin',
    userName: 'General Manager (Admin)',
    action: 'LOGIN',
    details: 'Admin logged in to Hotel Billing System',
  },
  {
    id: 'aud_2',
    timestamp: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
    userId: 'usr_cashier',
    userName: 'Frontdesk Cashier',
    action: 'BILL_SETTLED',
    details: 'Settled Bill GRP-20260906-0001 for ₹1,102 via UPI (T1)',
    billId: 'bill_001',
  },
  {
    id: 'aud_3',
    timestamp: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
    userId: 'usr_cashier',
    userName: 'Frontdesk Cashier',
    action: 'BILL_SETTLED',
    details: 'Settled Bill GRP-20260906-0002 for ₹1,402 via Cash (Takeaway)',
    billId: 'bill_002',
  },
];
