import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  UtensilsCrossed, 
  X, 
  Check, 
  FileSpreadsheet, 
  Flame, 
  AlertCircle,
  ImagePlus,
  Camera
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';
import { 
  exportMenuItemsToExcel, 
  exportMenuItemsToCSV, 
  parseMenuSpreadsheet 
} from '../../utils/excelExport';

export const MenuManagement: React.FC = () => {
  const { 
    menuItems, 
    categories, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    bulkImportMenuItems,
    settings,
    showToast
  } = useBilling();

  const { hasRole } = useAuth();
  const canManage = hasRole(['admin', 'manager']);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: categories[0]?.id || 'cat_starters',
    price: 250,
    gstRate: 5,
    hsnCode: '2106',
    isVeg: true,
    isSpicy: false,
    inStock: true,
    description: '',
    imageUrl: '' as string | undefined,
  });

  const filtered = menuItems.filter(item => {
    const matchCat = selectedCat === 'all' || item.categoryId === selectedCat;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiet = dietFilter === 'all' || 
                      (dietFilter === 'veg' && item.isVeg) || 
                      (dietFilter === 'nonveg' && !item.isVeg);
    return matchCat && matchSearch && matchDiet;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `ITEM-${menuItems.length + 1}`,
      name: '',
      categoryId: categories[1]?.id || categories[0]?.id || 'cat_starters',
      price: 250,
      gstRate: 5,
      hsnCode: '2106',
      isVeg: true,
      isSpicy: false,
      inStock: true,
      description: '',
      imageUrl: undefined,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      gstRate: item.gstRate || 5,
      hsnCode: item.hsnCode || '2106',
      isVeg: item.isVeg,
      isSpicy: item.isSpicy || false,
      inStock: item.inStock,
      description: item.description || '',
      imageUrl: item.imageUrl || undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Item name is required', 'error');
      return;
    }

    const submitData = { ...formData, imageUrl: formData.imageUrl || undefined };
    if (editingItem) {
      await updateMenuItem({ ...editingItem, ...submitData });
    } else {
      await addMenuItem(submitData);
    }
    setIsModalOpen(false);
  };

  // Compress and convert image to base64 for local IndexedDB storage
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress: resize to max 400px for storage efficiency
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.75);
          setFormData(prev => ({ ...prev, imageUrl: compressed }));
          showToast('Image uploaded & compressed for local storage', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset so user can re-upload same file
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: undefined }));
  };

  const handleToggleStock = async (item: MenuItem) => {
    if (!canManage) {
      showToast('Admin or Manager permission required', 'error');
      return;
    }
    await updateMenuItem({ ...item, inStock: !item.inStock });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Parsing spreadsheet...', 'info');
      const parsed = await parseMenuSpreadsheet(file, categories);
      if (parsed.length === 0) {
        showToast('No dishes found in sheet', 'error');
        return;
      }
      await bulkImportMenuItems(parsed);
    } catch (err: any) {
      console.error(err);
      showToast(`Import error: ${err.message || 'Check spreadsheet format'}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Menu & Food Catalog
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Total {menuItems.length} dishes in database • Excel and CSV import/export enabled
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>Import Sheet</span>
              </button>
            </>
          )}

          <button
            onClick={() => exportMenuItemsToExcel(menuItems, categories)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportMenuItemsToCSV(menuItems, categories)}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>CSV</span>
          </button>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs shadow-amber-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish name, code (e.g. MC-01)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Diet filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setDietFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                dietFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietFilter('veg')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                dietFilter === 'veg' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Veg
            </button>
            <button
              onClick={() => setDietFilter('nonveg')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                dietFilter === 'nonveg' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Non-Veg
            </button>
          </div>
        </div>
      </div>

      {/* Dishes Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16">Diet</th>
                <th className="py-3 px-3 w-24">Code</th>
                <th className="py-3 px-4">Dish Name & Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 w-20">HSN</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-center">GST %</th>
                <th className="py-3 px-3 text-center">Stock</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No dishes found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Diet */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
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
                          {item.isSpicy && <span title="Spicy">🌶️</span>}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-500 text-[11px]">
                        {item.code}
                      </td>

                      {/* Name & Desc */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                            {item.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                          {cat?.name || 'General'}
                        </span>
                      </td>

                      {/* HSN */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {item.hsnCode || '2106'}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        {settings.currencySymbol}{item.price}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {item.gstRate || 5}%
                      </td>

                      {/* In Stock toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleStock(item)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            item.inStock
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {item.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Dish"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-teal-600" />
                {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Dish'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dish / Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabadi Dum Chicken Biryani"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Price ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Restaurant)</option>
                    <option value={12}>12% (Beverages)</option>
                    <option value={18}>18% (Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Vegetarian</span>
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={e => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Spicy Flag</span>
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={e => setFormData({ ...formData, isSpicy: e.target.checked })}
                    className="w-4 h-4 accent-amber-600"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">In Stock</span>
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 accent-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients or preparation details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Dish Image Upload */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  Dish Photo (Optional — stored on device)
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {formData.imageUrl ? (
                  <div className="flex items-start gap-3">
                    <div className="relative group">
                      <img
                        src={formData.imageUrl}
                        alt="Dish preview"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-teal-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-rose-600 transition-colors"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        ✓ Image saved to device storage
                      </p>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline underline-offset-2"
                      >
                        Replace Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <ImagePlus className="w-7 h-7 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    <span className="text-[11px] text-slate-500 group-hover:text-teal-700 font-semibold transition-colors">
                      Tap to upload from Gallery or Camera
                    </span>
                    <span className="text-[10px] text-slate-400">
                      JPG, PNG, WebP · Auto-compressed for storage
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Dish?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{itemToDelete.name}</strong> ({itemToDelete.code})? This will be recorded in audit logs.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteMenuItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="flex-1 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
