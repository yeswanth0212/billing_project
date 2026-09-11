import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Sparkles, 
  Percent, 
  ArrowRight,
  Utensils,
  IceCream,
  Flame,
  Soup,
  Wheat,
  ChefHat,
  Layers,
  CheckCircle2,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { MenuItem, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { UpiQrModal } from './UpiQrModal';
import { SplitPaymentModal } from './SplitPaymentModal';

export const PosTerminal: React.FC = () => {
  const {
    menuItems,
    categories,
    cart,
    addToCart,
    updateCartQty,
    updateCartNotes,
    updateCartDiscount,
    removeFromCart,
    clearCart,
    subtotal,
    itemDiscountsTotal,
    calculatedDiscount,
    billDiscountPercent,
    setBillDiscountPercent,
    billDiscountAmount,
    setBillDiscountAmount,
    serviceChargeEnabled,
    setServiceChargeEnabled,
    serviceChargeAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    totalGst,
    grandTotal,
    roundingOff,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    kitchenInstructions,
    setKitchenInstructions,
    generateKOT,
    settleCurrentBill,
    settings,
    gstMode,
    setGstMode,
    showToast
  } = useBilling();

  const [selectedCatId, setSelectedCatId] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [activeStep, setActiveStep] = useState<'items' | 'verify' | 'settle'>('items');

  // Modals for payment
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCatId === 'cat_all' || item.categoryId === selectedCatId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'nonveg' && !item.isVeg);
    return matchesCat && matchesSearch && matchesDiet;
  });

  const getItemQuantityInCart = (id: string) => {
    return cart.find(i => i.menuItemId === id)?.quantity || 0;
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils className="w-3.5 h-3.5" />;
      case 'Soup': return <Soup className="w-3.5 h-3.5" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      case 'Wheat': return <Wheat className="w-3.5 h-3.5" />;
      case 'IceCream': return <IceCream className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const handleCashSettle = async () => {
    await settleCurrentBill('cash', { cashTendered, paymentRef: 'CASH' });
    setActiveStep('items');
  };

  const handleCardSettle = async () => {
    await settleCurrentBill('card', { paymentRef: paymentRef || 'CARD-TXN' });
    setActiveStep('items');
  };

  const handleUpiSuccess = async (upiRef: string) => {
    await settleCurrentBill('upi', { paymentRef: upiRef });
    setIsUpiModalOpen(false);
    setActiveStep('items');
  };

  const handleSplitSuccess = async (splitDetails: any) => {
    await settleCurrentBill('split', { splitDetails });
    setIsSplitModalOpen(false);
    setActiveStep('items');
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F -> Focus search input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveStep('items');
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }

      // Escape -> Step back or close active modal
      if (e.key === 'Escape') {
        if (isUpiModalOpen) {
          setIsUpiModalOpen(false);
        } else if (isSplitModalOpen) {
          setIsSplitModalOpen(false);
        } else if (activeStep !== 'items') {
          setActiveStep('items');
        }
        return;
      }

      // Ctrl/Cmd + P -> Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        // Let print receipt handle if modal open
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpiModalOpen, isSplitModalOpen, activeStep]);

  const changeDue = Math.max(0, cashTendered - grandTotal);

  return (
    <div className="space-y-5 pb-20 sm:pb-8">
      {/* 3 Step Workflow Navigation Pills */}
      <div className="flex items-center justify-center gap-2 max-w-md mx-auto bg-white p-1 rounded-2xl shadow-xs border border-slate-200">
        <button
          onClick={() => setActiveStep('items')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeStep === 'items'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>1. Select Dishes</span>
          <span className="bg-white/80 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {menuItems.length}
          </span>
        </button>

        <button
          onClick={() => cart.length > 0 && setActiveStep('verify')}
          disabled={cart.length === 0}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${
            activeStep === 'verify'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>2. Verify & Tax</span>
          <span className="bg-white/80 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        </button>

        <button
          onClick={() => cart.length > 0 && setActiveStep('settle')}
          disabled={cart.length === 0}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${
            activeStep === 'settle'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>3. Settle Bill</span>
          <span className="bg-white/80 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {settings.currencySymbol}{grandTotal}
          </span>
        </button>
      </div>

      {/* STEP 1: ITEMS SCREEN */}
      {activeStep === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Dishes Catalog */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search, Categories, & Veg/Non-Veg Filter */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search dishes, biryani, starters... (Ctrl + F)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white font-medium transition-all"
                  />
                </div>

                {/* Diet Filter Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setDietFilter('all')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      dietFilter === 'all'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDietFilter('veg')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                      dietFilter === 'veg'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
                    Veg
                  </button>
                  <button
                    onClick={() => setDietFilter('nonveg')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                      dietFilter === 'nonveg'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-300 inline-block" />
                    Non-Veg
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {getCategoryIcon(cat.icon)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredItems.map((item) => {
                const qty = getItemQuantityInCart(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-xs hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between group relative"
                  >
                    {/* Top: Veg / NonVeg + Code */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                            item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </div>
                        {item.isSpicy && <span className="text-[10px]" title="Spicy">🌶️</span>}
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-semibold">
                        {item.code}
                      </span>
                    </div>

                    {/* Dish Image */}
                    {item.imageUrl && (
                      <div className="my-1.5 -mx-1">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-20 object-cover rounded-xl border border-slate-100"
                        />
                      </div>
                    )}

                    {/* Dish Title & Description */}
                    <div className={item.imageUrl ? '' : 'my-1'}>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Add Controls */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-extrabold text-slate-900 font-mono">
                        {settings.currencySymbol}{item.price}
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="px-3 py-1 bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-700 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-xs border border-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-full px-1 py-0.5">
                          <button
                            onClick={() => updateCartQty(cart.find(i => i.menuItemId === item.id)!.id, -1)}
                            className="w-5 h-5 rounded-full hover:bg-amber-200 flex items-center justify-center text-slate-800 transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-mono text-xs text-slate-900 font-bold px-1">
                            {qty}
                          </span>
                          <button
                            onClick={() => addToCart(item, 1)}
                            className="w-5 h-5 rounded-full hover:bg-amber-200 flex items-center justify-center text-slate-800 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar Panel */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  Current Order ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <span className="text-[11px] text-teal-600 font-bold">
                  Quick Billing Counter
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Cart is currently empty.<br />Tap any dish to build the bill.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {settings.currencySymbol}{item.price} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {settings.currencySymbol}{item.price * item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <input
                        type="text"
                        placeholder="Add kitchen note..."
                        value={item.notes || ''}
                        onChange={e => updateCartNotes(item.id, e.target.value)}
                        className="bg-transparent text-[10px] text-slate-700 placeholder-slate-400 focus:outline-none w-36 truncate"
                      />

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-5 h-5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold text-slate-900 px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-5 h-5 rounded-md bg-white border border-slate-200 hover:bg-amber-400 flex items-center justify-center text-slate-700 text-xs"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions (Generate KOT) */}
            {cart.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => generateKOT()}
                  className="w-full py-2 px-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-orange-200"
                >
                  <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                  Print Kitchen Order Ticket (KOT)
                </button>
              </div>
            )}

            {/* Price Breakdown Footer */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 font-bold">{settings.currencySymbol}{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>GST ({gstMode}):</span>
                <span className="font-mono text-teal-700 font-bold">{settings.currencySymbol}{totalGst}</span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="font-mono text-teal-700 text-base">{settings.currencySymbol}{grandTotal}</span>
              </div>

              <button
                onClick={() => setActiveStep('verify')}
                disabled={cart.length === 0}
                className="w-full mt-2 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs flex items-center justify-between px-4 transition-all shadow-sm shadow-amber-400/20"
              >
                <span>{cart.reduce((a, b) => a + b.quantity, 0)} Items | {settings.currencySymbol}{grandTotal}</span>
                <span className="flex items-center gap-1">
                  Verify & Settle <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: VERIFY ORDER & TAX DETAILS */}
      {activeStep === 'verify' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                Verify Order & Taxes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply discounts, add customer details, or configure GST mode
              </p>
            </div>
            <button
              onClick={() => setActiveStep('items')}
              className="text-xs text-teal-600 font-bold hover:underline"
            >
              + Add More Dishes
            </button>
          </div>

          {/* Customer Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer / Guest Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Verma"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400 text-xs font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Customer Phone Number</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                  Direct WhatsApp
                </span>
              </div>
              <input
                type="tel"
                placeholder="e.g. 9876543210 (10 digits)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400 text-xs"
              />
              {customerPhone ? (
                <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span>✓ Bill will go directly to WhatsApp upon payment</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Enter mobile to send bill directly to customer's WhatsApp
                </p>
              )}
            </div>
          </div>

          {/* Discounts & Service Charge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={billDiscountPercent || ''}
                onChange={e => {
                  setBillDiscountPercent(Number(e.target.value));
                  setBillDiscountAmount(0);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <label className="block text-slate-700 font-semibold mb-1">Flat Discount ({settings.currencySymbol})</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={billDiscountAmount || ''}
                onChange={e => {
                  setBillDiscountAmount(Number(e.target.value));
                  setBillDiscountPercent(0);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <label className="block text-slate-700 font-semibold mb-1">Service Charge ({settings.serviceChargeRate}%)</label>
              <button
                type="button"
                onClick={() => setServiceChargeEnabled(!serviceChargeEnabled)}
                className={`w-full py-1.5 rounded-xl font-bold text-xs transition-all border ${
                  serviceChargeEnabled
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {serviceChargeEnabled ? '✓ Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* GST Mode Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-700 font-semibold">GST Calculation: </span>
              <span className="text-teal-700 font-bold capitalize">{gstMode}</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGstMode('exclusive')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  gstMode === 'exclusive' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Exclusive (Add Tax)
              </button>
              <button
                type="button"
                onClick={() => setGstMode('inclusive')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  gstMode === 'inclusive' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Inclusive (MRP)
              </button>
            </div>
          </div>

          {/* Kitchen Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Kitchen Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, pack separately, extra chutney..."
              value={kitchenInstructions}
              onChange={e => setKitchenInstructions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Tax Breakdown Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Items Total:</span>
              <span className="font-mono font-bold text-slate-900">{settings.currencySymbol}{subtotal}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">- {settings.currencySymbol}{calculatedDiscount}</span>
              </div>
            )}
            {serviceChargeEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>Service Charge:</span>
                <span className="font-mono text-slate-900">{settings.currencySymbol}{serviceChargeAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono text-slate-900">{settings.currencySymbol}{taxableAmount}</span>
            </div>
            <div className="flex justify-between text-teal-700 font-medium">
              <span>CGST (2.5%):</span>
              <span className="font-mono">{settings.currencySymbol}{cgstAmount}</span>
            </div>
            <div className="flex justify-between text-teal-700 font-medium">
              <span>SGST (2.5%):</span>
              <span className="font-mono">{settings.currencySymbol}{sgstAmount}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono text-teal-700 text-xl">{settings.currencySymbol}{grandTotal}</span>
            </div>
          </div>

          {/* Stepper Footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setActiveStep('items')}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs"
            >
              Back to Dishes
            </button>
            <button
              onClick={() => setActiveStep('settle')}
              className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-400/20"
            >
              <span>Choose Payment & Settle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SETTLE BILL SCREEN */}
      {activeStep === 'settle' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                Select Payment Mode
              </h2>
              <p className="text-xs text-slate-500">
                Amount Payable: <strong className="text-teal-700 font-mono text-sm">{settings.currencySymbol}{grandTotal}</strong>
              </p>
            </div>
            <button
              onClick={() => setActiveStep('verify')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Back
            </button>
          </div>

          {/* Customer & WhatsApp Delivery Bar */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                customerPhone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{customerName || 'Walk-in Customer'}</span>
                  {customerPhone && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                      Direct WhatsApp
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-medium mt-0.5">
                  {customerPhone ? (
                    <span className="text-emerald-700">✓ Bill will be sent directly to customer's WhatsApp on payment</span>
                  ) : (
                    <span className="text-amber-700">Enter mobile below to send bill directly to WhatsApp:</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="tel"
                placeholder="Mobile (10 digits)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 w-full sm:w-36"
              />
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('cash')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                selectedPaymentMethod === 'cash'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Banknote className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-bold">Cash</span>
            </button>

            {/* UPI Dynamic QR */}
            <button
              type="button"
              onClick={() => {
                setSelectedPaymentMethod('upi');
                setIsUpiModalOpen(true);
              }}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                selectedPaymentMethod === 'upi'
                  ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <QrCode className="w-6 h-6 text-teal-600" />
              <span className="text-xs font-bold">UPI (Scan QR)</span>
            </button>

            {/* Card */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('card')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                selectedPaymentMethod === 'card'
                  ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <CreditCard className="w-6 h-6 text-sky-600" />
              <span className="text-xs font-bold">Card Swipe</span>
            </button>

            {/* Split */}
            <button
              type="button"
              onClick={() => {
                setSelectedPaymentMethod('split');
                setIsSplitModalOpen(true);
              }}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                selectedPaymentMethod === 'split'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Layers className="w-6 h-6 text-amber-600" />
              <span className="text-xs font-bold">Split Payment</span>
            </button>
          </div>

          {/* Cash Input */}
          {selectedPaymentMethod === 'cash' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-800 font-bold">Cash Tendered by Customer</label>
                <div className="flex gap-1">
                  {[500, 1000, 2000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-teal-700 font-mono text-[11px] font-bold hover:bg-slate-100"
                    >
                      {settings.currencySymbol}{amt}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                placeholder={`Enter amount (e.g. ${grandTotal})`}
                value={cashTendered || ''}
                onChange={e => setCashTendered(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-base font-bold focus:outline-none focus:border-amber-400"
              />

              {cashTendered > grandTotal && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold">
                  <span>Change to Return:</span>
                  <span className="font-mono text-sm">{settings.currencySymbol}{changeDue}</span>
                </div>
              )}
            </div>
          )}

          {/* Card Input */}
          {selectedPaymentMethod === 'card' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <label className="text-slate-800 font-bold">Card Auth / Txn Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. AUTH-984201"
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Settle Action Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveStep('verify')}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs"
            >
              Back
            </button>

            {selectedPaymentMethod === 'cash' && (
              <button
                type="button"
                onClick={handleCashSettle}
                className="flex-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Cash Payment ({settings.currencySymbol}{grandTotal})
              </button>
            )}

            {selectedPaymentMethod === 'card' && (
              <button
                type="button"
                onClick={handleCardSettle}
                className="flex-2 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Card Payment ({settings.currencySymbol}{grandTotal})
              </button>
            )}

            {selectedPaymentMethod === 'upi' && (
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(true)}
                className="flex-2 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm shadow-md shadow-teal-600/25 flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Open UPI QR Scanner ({settings.currencySymbol}{grandTotal})
              </button>
            )}

            {selectedPaymentMethod === 'split' && (
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(true)}
                className="flex-2 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <Layers className="w-5 h-5" />
                Configure Split Distribution
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modals */}
      <UpiQrModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        amount={grandTotal}
        onConfirmPayment={handleUpiSuccess}
      />

      <SplitPaymentModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        totalAmount={grandTotal}
        hasRoomSelected={false}
        onConfirmSplit={handleSplitSuccess}
      />
    </div>
  );
};
