'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Landmark, User, FileText, CheckCircle, ArrowLeft, Plus, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Item = {
  id: string;
  name: string;
  category?: string;
  wholesalePrice: number;
  rollPrice: number;
  retailPrice: number;
  currentStockCartons: number;
  currentStockRolls: number;
  currentStockUnits: number;
  rollsPerCarton: number;
  unitsPerRoll: number;
  retailPerCarton: number;
};

type CartItem = {
  internalId: string; // unique id for cart key
  item: Item;
  unitType: 'WHOLESALE' | 'ROLL' | 'RETAIL';
  quantity: number;
  price: number;
  subtotal: number;
};

type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER';

type Account = {
  id: string;
  name: string;
  type: string; 
};

export default function SalesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Invoice Header State
  // const [customerName, setCustomerName] = useState(''); // Replaced by search
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Line Item Entry State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);
  const [pendingUnit, setPendingUnit] = useState<'WHOLESALE' | 'ROLL' | 'RETAIL'>('RETAIL');
  const [pendingQty, setPendingQty] = useState<number>(1);
  
  // Customer State
  type Customer = { id: string; name: string; phone?: string; address?: string; };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  
  // Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Refs for focus management
  // const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/');
    setUser(session?.user);
  };

  const fetchData = async () => {
    try {
      const [itemsRes, accountsRes, customersRes] = await Promise.all([
        axios.get(`${API_URL}/items`),
        axios.get(`${API_URL}/accounts`),
        axios.get(`${API_URL}/customers`)
      ]);
      setItems(itemsRes.data);
      setAccounts(accountsRes.data);
      setCustomers(customersRes.data);
    } catch (e) { console.error(e); }
  };

  // Filter for Autocomplete
  const suggestions = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10); // Limit to 10 for performance/UI

  const getPrice = (item: Item, type: string) => {
      if (type === 'WHOLESALE') return Number(item.wholesalePrice);
      if (type === 'ROLL') return Number(item.rollPrice);
      return Number(item.retailPrice);
  };

  const handleSelectItem = (item: Item) => {
      setPendingItem(item);
      setSearchQuery(item.name);
      setShowSuggestions(false);
      // Default to Carton if available, else Unit? User preference usually Unit.
      // Let's stick to Retail default for now, or maybe Smart default logic.
      setPendingUnit('RETAIL'); 
      setPendingQty(1);
  };

  const addLineItem = () => {
      if (!pendingItem) return;
      
      const price = getPrice(pendingItem, pendingUnit);
      const newItem: CartItem = {
          internalId: Math.random().toString(36).substr(2, 9),
          item: pendingItem,
          unitType: pendingUnit,
          quantity: pendingQty,
          price: price,
          subtotal: price * pendingQty
      };

      setCart([...cart, newItem]);
      
      // Reset Line
      setPendingItem(null);
      setSearchQuery('');
      setPendingQty(1);
      // document.getElementById('item-search-input')?.focus(); // Keep focus for rapid entry
  };

  const removeFromCart = (id: string) => {
      setCart(cart.filter(x => x.internalId !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const [isSaleComplete, setIsSaleComplete] = useState(false);

  // ... (previous handlers)

  const handleSale = async () => {
      if (cart.length === 0) return alert("Cart is empty");
      if ((paymentMethod === 'POS' || paymentMethod === 'TRANSFER') && !selectedAccountId) {
          return alert("Please select a Payment Account");
      }
      if (!user) return alert("User not logged in");

      setIsProcessing(true);
      try {
          const payload = {
              userId: user.id,
              customerName: selectedCustomer ? selectedCustomer.name : customerSearch, // Use selected name or typed text
              customerId: selectedCustomer?.id, // Link ID if selected
              notes,
              paymentMethod,
              paymentAccountId: selectedAccountId || undefined,
              items: cart.map(c => ({
                  itemId: c.item.id,
                  quantity: c.quantity,
                  unitType: c.unitType
              }))
          };

          await axios.post(`${API_URL}/sales/invoice`, payload);
          // Don't alert("Sale Recorded Successfully!") - interrupt flow.
          // Instead, switch to receipt mode.
          setIsSaleComplete(true);
          
      } catch (e: any) {
          alert("Failed to record sale: " + (e.response?.data?.error || e.message));
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownloadImage = async () => {
      // Target the hidden professional template instead of the UI
      const element = document.getElementById('professional-invoice-template');
      if (!element) return;
      
      try {
          const dataUrl = await toPng(element, { backgroundColor: '#ffffff', cacheBust: true });
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `Invoice-${(selectedCustomer?.name || customerSearch || 'Guest')}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e: any) {
          console.error("Screenshot failed:", e);
          alert("Failed to generate image: " + (e.message || e));
      }
  };

  const resetSale = () => {
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setNotes('');
      setPaymentMethod('CASH');
      setSelectedAccountId('');
      setIsSaleComplete(false);
      fetchData(); 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 md:py-8 font-sans animate-fade-in text-gray-900">
      
      {/* Top Navigation / Back */}
      <div className="w-full max-w-5xl px-4 mb-4 flex justify-between items-center print:hidden">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
        </button>
        <div className="text-sm font-bold text-gray-400">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Main Invoice Sheet */}
      <div id="invoice-capture-area" className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:min-h-[800px]">
        
        {/* Header Section */}
        <div className="p-8 border-b-2 border-[#f3f4f6] bg-[#f9fafb]/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                     <h1 className="text-3xl font-black tracking-tight text-[#111827] mb-1">INVOICE</h1>
                     <p className="text-sm font-medium text-[#9ca3af]"># {isSaleComplete ? 'RECEIPT' : 'NEW SALE ENTRY'}</p>
                </div>
                
                {/* Customer Details Inputs */}
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-50">
                    <div className="bg-white p-2 rounded-lg border border-[#e5e7eb] shadow-sm flex items-center min-w-[300px] relative">
                        <User className="h-4 w-4 text-[#9ca3af] mx-2" />
                        
                        {/* CUSTOMER SEARCH / SELECT */}
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Search or Add Customer..." 
                                className="w-full outline-none text-sm font-bold placeholder:font-normal text-[#111827] bg-transparent"
                                value={customerSearch}
                                onChange={e => {
                                    setCustomerSearch(e.target.value);
                                    setCustomerSearchOpen(true);
                                    if (!e.target.value) setSelectedCustomer(null);
                                }}
                                onFocus={() => setCustomerSearchOpen(true)}
                                disabled={isSaleComplete}
                            />
                            
                            {/* DROPDOWN */}
                            {customerSearchOpen && !isSaleComplete && (
                                <div className="absolute top-full left-0 w-full bg-white mt-2 border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[100]">
                                    {/* Existing Customers */}
                                    {customers
                                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch))
                                        .map(c => (
                                        <div 
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setCustomerSearch(c.name);
                                                setCustomerSearchOpen(false);
                                            }}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none"
                                        >
                                            <div className="font-bold text-gray-900">{c.name}</div>
                                            {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                                        </div>
                                    ))}
                                    
                                    {/* Create New Option */}
                                    <div 
                                        onClick={async () => {
                                            if (!customerSearch) return;
                                            try {
                                                const res = await axios.post(`${API_URL}/customers`, { name: customerSearch });
                                                const created = res.data;
                                                setCustomers([...customers, created]);
                                                setSelectedCustomer(created);
                                                setCustomerSearch(created.name);
                                                setCustomerSearchOpen(false);
                                            } catch(e: any) { 
                                                alert(e.response?.data?.error || "Failed to create customer"); 
                                            }
                                        }}
                                        className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-blue-600 font-bold text-sm flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" /> Add "{customerSearch || 'New Customer'}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedCustomer && (
                             <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="p-1 hover:text-red-500 text-gray-400">
                                 <Trash2 className="h-3 w-3" />
                             </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Responsive Invoice Container */}
        <div className="flex-1 p-0 overflow-x-hidden min-h-[400px] flex flex-col">
            
            {/* MOBILE: Entry Form (Top of list) */}
            {!isSaleComplete && (
                <div className="md:hidden p-4 bg-[#eff6ff]/50 border-b border-[#dbeafe] animate-fade-in">
                    <div className="space-y-3">
                         {/* Item Search */}
                         <div className="relative z-20">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#60a5fa]" />
                            <input 
                                type="text" 
                                placeholder="Search item..." 
                                className="w-full pl-9 pr-10 py-3 bg-white border border-[#bfdbfe] rounded-xl outline-none focus:ring-2 focus:ring-[#3b82f6] shadow-sm font-bold text-[#111827] text-sm"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                    if (!e.target.value) setPendingItem(null);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {/* Mobile Modal Trigger In Input */}
                            <button 
                                onClick={() => setShowProductModal(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#dbeafe] text-[#2563eb] rounded-lg hover:bg-[#bfdbfe]"
                            >
                                <Plus className="h-4 w-4" />
                            </button>

                            {/* Suggestions Dropdown (Mobile) */}
                            {showSuggestions && searchQuery && !pendingItem && (
                                <div className="absolute top-full left-0 w-full bg-white mt-1 border border-[#e5e7eb] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {suggestions.map(s => (
                                        <div 
                                            key={s.id}
                                            onClick={() => handleSelectItem(s)}
                                            className="p-3 border-b border-[#f9fafb] last:border-none active:bg-[#eff6ff]"
                                        >
                                            <div className="font-bold text-[#111827]">{s.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>

                         {/* Config Row */}
                         <div className="flex gap-2">
                             <select 
                                disabled={!pendingItem}
                                className="flex-1 p-3 bg-white border border-[#bfdbfe] rounded-xl outline-none font-medium text-sm disabled:opacity-50"
                                value={pendingUnit}
                                onChange={(e) => setPendingUnit(e.target.value as any)}
                             >
                                <option value="RETAIL">Unit (₦{pendingItem ? getPrice(pendingItem, 'RETAIL') : '-'})</option>
                                <option value="WHOLESALE">Carton (₦{pendingItem ? getPrice(pendingItem, 'WHOLESALE') : '-'})</option>
                                {pendingItem?.rollsPerCarton! > 0 && <option value="ROLL">Roll (₦{pendingItem ? getPrice(pendingItem, 'ROLL') : '-'})</option>}
                             </select>
                             
                             <div className="w-24 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af]">Qty</span>
                                <input 
                                    disabled={!pendingItem}
                                    type="number" 
                                    min="1"
                                    className="w-full pl-10 pr-2 py-3 bg-white border border-[#bfdbfe] rounded-xl outline-none font-bold text-center text-sm disabled:opacity-50"
                                    value={pendingQty}
                                    onChange={e => setPendingQty(parseInt(e.target.value) || 1)}
                                />
                             </div>
                         </div>

                         {/* Add Button */}
                         <button 
                            onClick={addLineItem}
                            disabled={!pendingItem}
                            className="w-full py-3 bg-[#2563eb] text-white rounded-xl font-bold shadow-md hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                         >
                            <Plus className="h-5 w-5" />
                            <span>Add Item <span className="opacity-50 mx-1">•</span> ₦{pendingItem ? (getPrice(pendingItem, pendingUnit) * pendingQty).toLocaleString() : '0'}</span>
                         </button>
                    </div>
                </div>
            )}

            {/* MOBILE: Cart List (Cards) */}
            <div className="md:hidden flex-1 bg-[#f9fafb] p-4 space-y-3">
                {cart.map((c, idx) => (
                    <div key={c.internalId} className="bg-white p-4 rounded-xl shadow-sm border border-[#f3f4f6] flex justify-between items-center group">
                        <div className="flex-1">
                            <h4 className="font-bold text-[#111827]">{c.item.name}</h4>
                            <div className="flex gap-2 text-xs text-[#6b7280] mt-1">
                                <span className="bg-[#f3f4f6] px-1.5 py-0.5 rounded">{c.unitType}</span>
                                <span>x {c.quantity}</span>
                                <span>@ ₦{c.price.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="font-black text-[#111827]">₦{c.subtotal.toLocaleString()}</div>
                             {!isSaleComplete && (
                                 <button onClick={() => removeFromCart(c.internalId)} className="p-2 text-[#d1d5db] hover:text-[#ef4444]">
                                     <Trash2 className="h-4 w-4" />
                                 </button>
                             )}
                        </div>
                    </div>
                ))}
            </div>


            {/* DESKTOP: Traditional Table (Hidden on Mobile) */}
            <table className="hidden md:table w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-xs uppercase tracking-widest text-[#6b7280] font-bold">
                        <th className="py-4 pl-8 w-16">No.</th>
                        <th className="py-4 px-4 w-[40%]">Item Description</th>
                        <th className="py-4 px-4 w-[15%]">Unit</th>
                        <th className="py-4 px-4 w-[10%] text-center">Qty</th>
                        <th className="py-4 px-4 w-[15%] text-right">Price</th>
                        <th className="py-4 pr-8 w-[15%] text-right">Total</th>
                        <th className="py-4 w-12 text-center print:hidden"></th> 
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6] text-sm">
                    {/* Existing Cart Items */}
                    {cart.map((c, idx) => (
                        <tr key={c.internalId} className="group hover:bg-[#eff6ff]/30 transition-colors">
                            <td className="py-4 pl-8 font-mono text-[#9ca3af]">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="py-4 px-4 font-bold text-[#111827]">{c.item.name}</td>
                            <td className="py-4 px-4">
                                <span className="bg-[#f3f4f6] text-[#4b5563] px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                    {c.unitType}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center font-bold">{c.quantity}</td>
                            <td className="py-4 px-4 text-right text-[#6b7280]">₦{c.price.toLocaleString()}</td>
                            <td className="py-4 pr-8 text-right font-bold text-[#111827]">₦{c.subtotal.toLocaleString()}</td>
                            <td className="py-4 text-center print:hidden">
                                {!isSaleComplete && (
                                    <button onClick={() => removeFromCart(c.internalId)} className="text-[#d1d5db] hover:text-[#ef4444] transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}

                    {/* DESKTOP ENTRY ROW */}
                    {!isSaleComplete && (
                        <tr className="bg-[#eff6ff]/50 border-t-2 border-[#dbeafe] print:hidden">
                            <td className="py-4 pl-8 font-mono text-[#93c5fd]">{(cart.length + 1).toString().padStart(2, '0')}</td>
                            
                            {/* SEARCH INPUT */}
                            <td className="py-4 px-4 relative">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#60a5fa]" />
                                        <input 
                                            id="item-search-input"
                                            type="text" 
                                            placeholder="Type to search..." 
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-[#bfdbfe] rounded-lg outline-none focus:ring-2 focus:ring-[#3b82f6] shadow-sm font-bold text-[#111827] placeholder:text-[#9ca3af]"
                                            value={searchQuery}
                                            onChange={e => {
                                                setSearchQuery(e.target.value);
                                                setShowSuggestions(true);
                                                if (!e.target.value) setPendingItem(null);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            autoComplete="off"
                                        />
                                        {/* Dropdown */}
                                        {showSuggestions && searchQuery && !pendingItem && (
                                            <div className="absolute top-full left-0 w-full bg-white mt-1 border border-[#e5e7eb] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                {suggestions.length > 0 ? (
                                                    suggestions.map(s => (
                                                        <div 
                                                            key={s.id}
                                                            onClick={() => handleSelectItem(s)}
                                                            className="p-3 hover:bg-[#eff6ff] cursor-pointer border-b border-[#f9fafb] last:border-none"
                                                        >
                                                            <div className="font-bold text-[#111827]">{s.name}</div>
                                                            <div className="flex gap-2 text-xs text-[#9ca3af] mt-0.5">
                                                                <span>Unit: ₦{s.retailPrice}</span>
                                                                {s.wholesalePrice > 0 && <span>• Ctn: ₦{s.wholesalePrice}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-[#9ca3af] italic">No matches found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setShowProductModal(true)}
                                        className="p-2 bg-white border border-[#bfdbfe] text-[#2563eb] rounded-lg hover:bg-[#eff6ff] hover:border-[#93c5fd] transition-colors"
                                        title="Browse Product List"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>

                            {/* UNIT SELECT */}
                            <td className="py-4 px-4">
                                <select 
                                    disabled={!pendingItem}
                                    className="w-full p-2 bg-white border border-[#bfdbfe] rounded-lg outline-none focus:ring-2 focus:ring-[#3b82f6] font-medium text-sm disabled:bg-[#f9fafb] disabled:text-[#d1d5db] text-[#111827]"
                                    value={pendingUnit}
                                    onChange={(e) => setPendingUnit(e.target.value as any)}
                                >
                                    <option value="RETAIL">Unit</option>
                                    <option value="WHOLESALE">Carton</option>
                                    {pendingItem?.rollsPerCarton! > 0 && <option value="ROLL">Roll</option>}
                                </select>
                            </td>

                            {/* QTY */}
                            <td className="py-4 px-4 text-center">
                                <input 
                                    disabled={!pendingItem}
                                    type="number" 
                                    min="1"
                                    className="w-16 p-2 text-center bg-white border border-[#bfdbfe] rounded-lg outline-none focus:ring-2 focus:ring-[#3b82f6] font-bold disabled:bg-[#f9fafb] disabled:text-[#d1d5db] text-[#111827]"
                                    value={pendingQty}
                                    onChange={e => setPendingQty(parseInt(e.target.value) || 1)}
                                    onKeyDown={e => {
                                        if(e.key === 'Enter') addLineItem();
                                    }}
                                />
                            </td>

                            {/* PREVIEW PRICE */}
                            <td className="py-4 px-4 text-right">
                                {pendingItem && (
                                    <span className="text-[#6b7280]">₦{getPrice(pendingItem, pendingUnit).toLocaleString()}</span>
                                )}
                            </td>

                            {/* PREVIEW TOTAL */}
                            <td className="py-4 pr-8 text-right font-bold text-[#1e3a8a]">
                                {pendingItem && (
                                    <span>₦{(getPrice(pendingItem, pendingUnit) * pendingQty).toLocaleString()}</span>
                                )}
                            </td>

                            <td className="py-4 text-center">
                                <button 
                                    onClick={addLineItem}
                                    disabled={!pendingItem}
                                    className="p-2 bg-[#2563eb] text-white rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:shadow-none transition-all"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {/* Empty State / Vertical Spacing (Responsive) */}
            {!isSaleComplete && cart.length === 0 && (
                <div className="flex-1 h-32 bg-[#f9fafb]/10 border-t border-dashed border-[#e5e7eb] flex items-center justify-center text-[#d1d5db] text-sm italic">
                    Start by adding items...
                </div>
            )}
            {/* Pad bottom if receipt */}
            {isSaleComplete && <div className="h-12"></div>}
        </div>

        {/* Footer / Calculation Bar */}
        <div className="bg-gray-900 text-white p-6 md:p-8 print:bg-white print:text-black print:border-t-4 print:border-black">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                
                {/* Notes & payment */}
                <div className="flex-1 w-full md:w-auto space-y-4">
                     {/* Method */}
                     <div className="flex items-center gap-4 print:hidden">
                        <span className="text-xs font-bold text-gray-500 uppercase">Payment:</span>
                        <div className="flex gap-2">
                            {(['CASH', 'POS', 'TRANSFER'] as PaymentMethod[]).map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    disabled={isSaleComplete}
                                    className={`px-3 py-1 text-xs font-bold rounded-md border text-center transition-all ${paymentMethod === m ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'} ${isSaleComplete ? 'opacity-50 cursor-default' : ''}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                     </div>
                     
                     {/* Account if needed */}
                     {(paymentMethod === 'POS' || paymentMethod === 'TRANSFER') && (
                         <div className="flex items-center gap-4 animate-fade-in print:hidden">
                             <span className="text-xs font-bold text-gray-500 uppercase">Account:</span>
                             <select
                                className="bg-gray-800 text-white text-sm border border-gray-700 rounded px-3 py-1 outline-none focus:border-blue-500 disabled:opacity-50"
                                value={selectedAccountId}
                                onChange={e => setSelectedAccountId(e.target.value)}
                                disabled={isSaleComplete}
                             >
                                 <option value="">Select Account...</option>
                                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                             </select>
                         </div>
                     )}

                     <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase">Note:</span>
                        <input 
                            type="text" 
                            className="bg-transparent border-b border-gray-700 text-sm text-white placeholder:text-gray-600 outline-none focus:border-white w-full max-w-xs disabled:border-transparent disabled:text-gray-300"
                            placeholder={isSaleComplete ? "" : "Optional reference..."}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={isSaleComplete}
                        />
                     </div>
                </div>

                {/* Totals & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto border-t md:border-t-0 border-gray-800 pt-4 md:pt-0 mt-4 md:mt-0">
                    <div>
                        <div className="text-right">
                            <span className="block text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-1">Total Due</span>
                            <span className="block text-2xl md:text-4xl font-black tracking-tight">₦{cartTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {!isSaleComplete ? (
                        <button 
                            onClick={handleSale}
                            disabled={cart.length === 0 || isProcessing}
                            className={`h-12 md:h-16 px-4 md:px-8 rounded-xl font-bold text-sm md:text-lg flex items-center gap-2 md:gap-3 transition-all
                                ${cart.length === 0 || isProcessing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/50 hover:-translate-y-1 active:scale-95'}
                            `}
                        >
                            {isProcessing ? 'Saving...' : 'COMPLETE SALE'}
                            {!isProcessing && <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />}
                        </button>
                    ) : (
                        <div className="flex gap-2 md:gap-4 print:hidden no-capture">
                            <button 
                                onClick={handleDownloadImage}
                                className="h-12 md:h-16 px-4 md:px-6 bg-white text-gray-900 rounded-xl font-bold text-sm md:text-lg flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                <Download className="h-4 w-4 md:h-5 md:w-5" /> <span className="hidden md:inline">Download</span>
                            </button>
                            <button 
                                onClick={resetSale}
                                className="h-12 md:h-16 px-4 md:px-6 bg-green-600 text-white rounded-xl font-bold text-sm md:text-lg flex items-center gap-2 hover:bg-green-500 transition-colors shadow-lg hover:shadow-green-900/50"
                            >
                                <Plus className="h-4 w-4 md:h-5 md:w-5" /> <span className="hidden md:inline">New Sale</span><span className="md:hidden">New</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      


      {/* PRODUCT BROWSER MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
                  <button 
                    onClick={() => setShowProductModal(false)}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <div className="p-6 border-b border-gray-100">
                      <h2 className="text-2xl font-black text-gray-900">Browse Products</h2>
                      <div className="mt-4 relative">
                          <Search className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
                          <input 
                              type="text" 
                              placeholder="Filter grid..." 
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-400 focus:ring-1 focus:ring-black"
                              value={modalSearch}
                              onChange={e => setModalSearch(e.target.value)}
                              autoFocus
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items
                                .filter(item => item.name.toLowerCase().includes(modalSearch.toLowerCase()))
                                .map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => {
                                        handleSelectItem(item);
                                        setShowProductModal(false);
                                    }}
                                    className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded mb-2 inline-block">
                                        {item.category || 'Item'}
                                    </div>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-2 line-clamp-2 h-10">{item.name}</h3>
                                    <div className="text-xs text-gray-400 mb-2">Stock: {item.currentStockUnits}</div>
                                    <div className="font-black text-lg text-blue-600">₦{Number(item.retailPrice).toLocaleString()}</div>
                                </div>
                            ))}
                      </div>
                  </div>
             </div>
        </div>
      )}

      {/* HIDDEN INVOICE TEMPLATE FOR GENERATION */}
      <div 
        id="printable-invoice" 
        className="fixed top-0 left-0 w-[800px] bg-white text-black p-12 hidden" 
        style={{ display: 'none' }} // We will toggle this during capture or use a different technique if display:none fails. 
        // Actually, html-to-image usually needs the element to be rendered.
        // Best approach: Absolute positioning off-screen is safer than display:none for some libraries, 
        // but let's try a technique: We can render it visible but z-index -100 or top -10000px.
      >
           {/* However, for html-to-image to work reliably, the font needs to be loaded and layout computed.
               We'll use a wrapper that is fixed/offscreen.
           */}
      </div>
      
      {/* Real implementation of the off-screen invoice */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
        <div id="professional-invoice-template" className="bg-white p-12 min-h-[1000px] w-full text-gray-900 font-sans relative">
            
            {/* Watermark / Bg Decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <h1 className="text-[150px] font-black -rotate-45">PEAK STORE</h1>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                <div>
                     <h1 className="text-4xl font-black tracking-tight mb-2">PEAK STORE</h1>
                     <p className="text-sm text-gray-600 font-medium max-w-[250px] leading-relaxed">
                         Premium Quality Goods<br/>
                         Lagos, Nigeria<br/>
                         Tel: 08030641541
                     </p>
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-black text-gray-200 mb-2">INVOICE</h2>
                    <div className="flex flex-col gap-1 text-sm font-bold">
                        <div className="flex justify-between gap-8"><span className="text-gray-500">Invoice No:</span> <span>#{Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</span></div>
                        <div className="flex justify-between gap-8"><span className="text-gray-500">Date:</span> <span>{new Date().toLocaleDateString('en-GB')}</span></div>
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-12">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Bill To:</span>
                <h3 className="text-2xl font-bold bg-gray-50 inline-block px-4 py-2 border-l-4 border-black min-w-[300px]">
                    {selectedCustomer ? selectedCustomer.name : (customerSearch || 'Guest Customer')}
                </h3>
                {selectedCustomer && selectedCustomer.phone && (
                   <div className="mt-2 text-sm text-gray-500 font-medium">{selectedCustomer.phone}</div>
                )}
            </div>

            {/* Table */}
            <table className="w-full text-left mb-12">
                <thead>
                    <tr className="border-b-2 border-black text-xs font-black uppercase tracking-widest">
                        <th className="py-4 w-12 text-gray-400">#</th>
                        <th className="py-4">Item Description</th>
                        <th className="py-4">Unit</th>
                        <th className="py-4 text-center">Qty</th>
                        <th className="py-4 text-right">Price</th>
                        <th className="py-4 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm font-medium">
                    {cart.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-4 text-gray-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="py-4 font-bold">{c.item.name}</td>
                            <td className="py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{c.unitType}</span></td>
                            <td className="py-4 text-center">{c.quantity}</td>
                            <td className="py-4 text-right text-gray-600">₦{c.price.toLocaleString()}</td>
                            <td className="py-4 text-right font-bold">₦{c.subtotal.toLocaleString()}</td>
                        </tr>
                    ))}
                    {/* Fills blank space if short */}
                    {cart.length < 5 && Array.from({ length: 5 - cart.length }).map((_, i) => (
                        <tr key={`fill-${i}`}>
                            <td className="py-4">&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-16">
                <div className="w-[300px] space-y-3">
                    <div className="flex justify-between text-sm font-bold text-gray-500">
                        <span>Subtotal:</span>
                        <span>₦{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-black border-t-2 border-black pt-4">
                        <span>Total:</span>
                        <span>₦{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 pt-2 uppercase">
                         <span>Payment Method:</span>
                         <span className="text-black bg-gray-100 px-2 py-0.5 rounded">{paymentMethod}</span>
                    </div>
                    {notes && (
                         <div className="text-right text-xs text-gray-500 italic mt-2 border-t border-dashed border-gray-200 pt-2">
                             "{notes}"
                         </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-12 right-12 text-center border-t border-gray-100 pt-8">
                <p className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
                    THANK YOU FOR SHOPPING!
                </p>
                <p className="text-xs text-gray-400">
                    Terms & Conditions Apply. Goods sold in good condition are not returnable after 3 days.
                </p>
            </div>
        </div>
      </div>

      </div>
    </div>
  );
}
