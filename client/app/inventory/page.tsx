'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Clipboard, Tag, X, Truck, Edit, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RestockModal from '@/components/RestockModal';
import AuthSync from '@/components/AuthSync';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function InventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // State for Dynamic Form
    const [editingItem, setEditingItem] = useState<any>(null);
    const [restockingItem, setRestockingItem] = useState<any>(null);
    
    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        
        // Structure Flags
        hasCarton: true,
        hasRoll: false,
        hasUnit: true,
        
        // Relationships
        rollsPerCarton: '',
        unitsPerRoll: '',
        unitsPerCarton: '', // Only if no rolls
        
        // Costs & Prices
        purchaseUnit: 'CARTON', // 'CARTON', 'ROLL', 'UNIT'
        purchaseCost: '', // Cost of the Purchase Unit
        
        wholesalePrice: '', // Carton Sell Price
        rollPrice: '',
        retailPrice: '', // Unit Sell Price
        
        // Initial Stock
        stockCartons: '',
        stockRolls: '',
        stockUnits: ''
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${API_URL}/items`);
            setItems(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate Normalized Unit Cost for display/verify
    const getCalculatedUnitCost = () => {
        const cost = Number(formData.purchaseCost);
        if (!cost) return 0;
        
        if (formData.purchaseUnit === 'UNIT') return cost;
        
        if (formData.purchaseUnit === 'ROLL') {
            const units = Number(formData.unitsPerRoll);
            return units > 0 ? cost / units : 0;
        }
        
        if (formData.purchaseUnit === 'CARTON') {
            let totalUnits = 0;
            if (formData.hasRoll) {
                totalUnits = Number(formData.rollsPerCarton) * Number(formData.unitsPerRoll);
            } else {
                totalUnits = Number(formData.unitsPerCarton);
            }
            return totalUnits > 0 ? cost / totalUnits : 0;
        }
        return 0;
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        
        const hasRoll = item.rollsPerCarton > 0;
        const hasCarton = item.wholesalePrice > 0 || item.rollsPerCarton > 0 || item.retailPerCarton > 1; // Heuristic
        // Better heuristic: Check checks
        
        // Re-construct state is tricky without explicit flags in DB, but we can infer:
        // If rollsPerCarton > 0, then Has Rolls.
        // If retailPerCarton > 1, Likely Has Cartons.
        
        // For now, let's just populate values and let user adjust structure if needed.
        // Simplified Load:
        setFormData({
            name: item.name,
            hasCarton: true, // Defaulting true for edit safety, user can uncheck
            hasRoll: item.rollsPerCarton > 0,
            hasUnit: true,
            
            rollsPerCarton: item.rollsPerCarton || '',
            unitsPerRoll: item.unitsPerRoll || '',
            unitsPerCarton: item.retailPerCarton || '',
            
            purchaseUnit: 'CARTON', // Default to carton for safety
            purchaseCost: '', // We verify cost below
            
            wholesalePrice: item.wholesalePrice,
            rollPrice: item.rollPrice,
            retailPrice: item.retailPrice,
            
            stockCartons: item.currentStockCartons,
            stockRolls: item.currentStockRolls,
            stockUnits: item.currentStockUnits
        });
        
        // Try to reverse-engineer calculated cost
        // If we assume DB stored Normalized Unit Cost in item.costPrice
        // We can show that as Unit Cost.
        // setFormData(prev => ({ ...prev, purchaseUnit: 'UNIT', purchaseCost: item.costPrice }));
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Calculate Configuration
            const rpc = formData.hasCarton && formData.hasRoll ? Number(formData.rollsPerCarton) : 0;
            const upr = formData.hasRoll && formData.hasUnit ? Number(formData.unitsPerRoll) : 0;
            
            // Calculate total retail per carton
            let retailPerC = 0;
            if (formData.hasCarton) {
                if (formData.hasRoll && formData.hasUnit) {
                    retailPerC = rpc * upr;
                } else if (!formData.hasRoll && formData.hasUnit) {
                    retailPerC = Number(formData.unitsPerCarton);
                }
            }

            // 2. Calculate Normalized Cost Price (Base Unit Cost)
            const baseUnitCost = getCalculatedUnitCost();

            const payload = {
                name: formData.name,
                category: "", // Removed as requested
                
                wholesalePrice: formData.hasCarton ? Number(formData.wholesalePrice) : 0,
                rollPrice: formData.hasRoll ? Number(formData.rollPrice) : 0,
                retailPrice: formData.hasUnit ? Number(formData.retailPrice) : 0,
                
                costPrice: baseUnitCost, // Storing NORMALIZED cost
                
                rollsPerCarton: rpc,
                unitsPerRoll: upr,
                retailPerCarton: retailPerC,
                
                // Stocks
                currentStockCartons: Number(formData.stockCartons || 0),
                currentStockRolls: Number(formData.stockRolls || 0),
                currentStockUnits: Number(formData.stockUnits || 0)
            };

            if (editingItem) {
                await axios.put(`${API_URL}/items/${editingItem.id}`, payload);
                alert('Item updated successfully');
            } else {
                await axios.post(`${API_URL}/items`, payload);
                alert('Item added successfully');
            }

            resetForm();
            fetchItems();
        } catch(e) { 
            alert('Failed to save item');
            console.error(e);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({
            name: '', hasCarton: true, hasRoll: false, hasUnit: true,
            rollsPerCarton: '', unitsPerRoll: '', unitsPerCarton: '',
            purchaseUnit: 'CARTON', purchaseCost: '',
            wholesalePrice: '', rollPrice: '', retailPrice: '',
            stockCartons: '', stockRolls: '', stockUnits: ''
        });
    };

  return (
        <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-6 animate-fade-in">
             <AuthSync />
             <PageHeader 
                title="Inventory Manager" 
                subtitle="Configure items, prices, and stock"
                action={
                    !showForm ? (
                        <button 
                            onClick={() => setShowForm(true)}
                            className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 shadow-lg transition-transform active:scale-95 font-bold text-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </button>
                    ) : null
                }
             />

            {showForm && (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl mb-8 border border-gray-100 animate-slide-up relative">
                    <button onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X/></button>
                    <h2 className="text-2xl font-black mb-1 text-gray-900">{editingItem ? 'Edit Item' : 'New Item Setup'}</h2>
                    <p className="text-sm text-gray-500 mb-8 font-medium">Define how you buy and sell this product.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 1. Identity */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Item Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="block w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition font-bold text-lg" required placeholder="e.g. Cooking Oil 5L" />
                        </div>

                        {/* 2. Structure Configuration */}
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                             <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center"><Package className="h-4 w-4 mr-2"/> Unit Configuration</h3>
                             <div className="flex flex-wrap gap-4 mb-6">
                                 {/* Carton Toggle */}
                                 <label className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.hasCarton ? 'border-black bg-white shadow-md' : 'border-transparent bg-gray-100 opacity-60'}`}>
                                     <input type="checkbox" checked={formData.hasCarton} onChange={e => setFormData({...formData, hasCarton: e.target.checked})} className="hidden"/>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasCarton ? 'border-black' : 'border-gray-400'}`}>
                                         {formData.hasCarton && <div className="w-2.5 h-2.5 bg-black rounded-full"/>}
                                     </div>
                                     <span className="font-bold">Cartons</span>
                                 </label>
                                 
                                 {/* Roll Toggle */}
                                 <label className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.hasRoll ? 'border-black bg-white shadow-md' : 'border-transparent bg-gray-100 opacity-60'}`}>
                                     <input type="checkbox" checked={formData.hasRoll} onChange={e => setFormData({...formData, hasRoll: e.target.checked})} className="hidden"/>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasRoll ? 'border-black' : 'border-gray-400'}`}>
                                         {formData.hasRoll && <div className="w-2.5 h-2.5 bg-black rounded-full"/>}
                                     </div>
                                     <span className="font-bold">Rolls</span>
                                 </label>
                                 
                                 {/* Unit Toggle */}
                                 <label className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.hasUnit ? 'border-black bg-white shadow-md' : 'border-transparent bg-gray-100 opacity-60'}`}>
                                     <input type="checkbox" checked={formData.hasUnit} onChange={e => setFormData({...formData, hasUnit: e.target.checked})} className="hidden"/>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasUnit ? 'border-black' : 'border-gray-400'}`}>
                                         {formData.hasUnit && <div className="w-2.5 h-2.5 bg-black rounded-full"/>}
                                     </div>
                                     <span className="font-bold">Single Units</span>
                                 </label>
                             </div>

                             {/* Relationships */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                 {formData.hasCarton && formData.hasRoll && (
                                     <div>
                                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">How many Rolls in a Carton?</label>
                                         <input type="number" value={formData.rollsPerCarton} onChange={e => setFormData({...formData, rollsPerCarton: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 font-bold focus:ring-black focus:border-black" placeholder="e.g. 10" required />
                                     </div>
                                 )}
                                 {formData.hasRoll && formData.hasUnit && (
                                     <div>
                                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">How many Units in a Roll?</label>
                                         <input type="number" value={formData.unitsPerRoll} onChange={e => setFormData({...formData, unitsPerRoll: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 font-bold focus:ring-black focus:border-black" placeholder="e.g. 12" required />
                                     </div>
                                 )}
                                 {formData.hasCarton && formData.hasUnit && !formData.hasRoll && (
                                     <div>
                                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">How many Units in a Carton?</label>
                                         <input type="number" value={formData.unitsPerCarton} onChange={e => setFormData({...formData, unitsPerCarton: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 font-bold focus:ring-black focus:border-black" placeholder="e.g. 24" required />
                                     </div>
                                 )}
                             </div>
                        </div>
                        
                        {/* 3. Costing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Cost Price</h3>
                                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                     <div>
                                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">I buy this item in:</label>
                                         <select 
                                            value={formData.purchaseUnit} 
                                            onChange={e => setFormData({...formData, purchaseUnit: e.target.value})}
                                            className="w-full p-3 rounded-lg border border-gray-200 font-bold bg-white mb-2"
                                         >
                                             {formData.hasCarton && <option value="CARTON">Cartons</option>}
                                             {formData.hasRoll && <option value="ROLL">Rolls</option>}
                                             {formData.hasUnit && <option value="UNIT">Units</option>}
                                         </select>
                                     </div>
                                     <div>
                                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cost per {formData.purchaseUnit.toLowerCase()}</label>
                                          <div className="relative">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                              <input type="number" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} className="w-full pl-8 p-3 rounded-lg border border-gray-200 font-black" placeholder="0.00" />
                                          </div>
                                     </div>
                                     
                                     {/* Calculated Check */}
                                     {formData.purchaseCost && (
                                         <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs font-bold flex items-center">
                                             <HelpCircle className="h-3 w-3 mr-2"/>
                                             Base Cost: ₦{getCalculatedUnitCost().toFixed(2)} / unit
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div>
                                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Selling Prices</h3>
                                 <div className="space-y-3">
                                     {formData.hasCarton && (
                                         <div>
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carton Price</label>
                                             <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                             <input type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} className="w-full pl-8 p-3 rounded-lg border border-gray-200 font-bold" required />
                                             </div>
                                         </div>
                                     )}
                                     {formData.hasRoll && (
                                         <div>
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Roll Price</label>
                                             <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                             <input type="number" value={formData.rollPrice} onChange={e => setFormData({...formData, rollPrice: e.target.value})} className="w-full pl-8 p-3 rounded-lg border border-gray-200 font-bold" required />
                                             </div>
                                         </div>
                                     )}
                                     {formData.hasUnit && (
                                         <div>
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Unit Price</label>
                                             <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                             <input type="number" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} className="w-full pl-8 p-3 rounded-lg border border-gray-200 font-bold" required />
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        {/* 4. Initial Stock */}
                        {!editingItem && (
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Initial Stock Levels</h3>
                                <div className="flex gap-4">
                                     {formData.hasCarton && (
                                         <div className="flex-1">
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cartons</label>
                                             <input type="number" value={formData.stockCartons} onChange={e => setFormData({...formData, stockCartons: e.target.value})} className="w-full p-3 rounded-lg bg-gray-50 font-bold" placeholder="0" />
                                         </div>
                                     )}
                                     {formData.hasRoll && (
                                         <div className="flex-1">
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rolls</label>
                                             <input type="number" value={formData.stockRolls} onChange={e => setFormData({...formData, stockRolls: e.target.value})} className="w-full p-3 rounded-lg bg-gray-50 font-bold" placeholder="0" />
                                         </div>
                                     )}
                                     {formData.hasUnit && (
                                         <div className="flex-1">
                                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Units</label>
                                             <input type="number" value={formData.stockUnits} onChange={e => setFormData({...formData, stockUnits: e.target.value})} className="w-full p-3 rounded-lg bg-gray-50 font-bold" placeholder="0" />
                                         </div>
                                     )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-6">
                             <button type="button" onClick={resetForm} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                             <button type="submit" className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold shadow-lg transition-transform active:scale-95">Save Item</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Item List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item: any) => {
                     // Determine structure for display
                     const hasC = item.wholesalePrice > 0;
                     const hasR = item.rollsPerCarton > 0;
                     const hasU = item.retailPrice > 0;
                     
                     return (
                        <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-black text-xl text-gray-900">{item.name}</h3>
                                <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"><Edit className="h-4 w-4"/></button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className={`text-center p-2 rounded-lg border ${hasC ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-transparent opacity-30'}`}>
                                    <div className="text-[10px] font-bold uppercase text-gray-400">Carton</div>
                                    <div className="font-bold text-sm">₦{Number(item.wholesalePrice).toLocaleString()}</div>
                                    {hasC && <div className="mt-1 text-xs font-black bg-white border border-gray-200 rounded px-2 py-0.5">{item.currentStockCartons}</div>}
                                </div>
                                <div className={`text-center p-2 rounded-lg border ${hasR ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-transparent opacity-30'}`}>
                                    <div className="text-[10px] font-bold uppercase text-gray-400">Roll</div>
                                    <div className="font-bold text-sm">₦{Number(item.rollPrice).toLocaleString()}</div>
                                     {hasR && <div className="mt-1 text-xs font-black bg-white border border-gray-200 rounded px-2 py-0.5">{item.currentStockRolls}</div>}
                                </div>
                                <div className={`text-center p-2 rounded-lg border ${hasU ? 'bg-black text-white border-black' : 'bg-gray-50/50 border-transparent opacity-30'}`}>
                                    <div className="text-[10px] font-bold uppercase text-gray-400">Unit</div>
                                    <div className={`font-bold text-sm ${hasU ? 'text-white' : 'text-gray-900'}`}>₦{Number(item.retailPrice).toLocaleString()}</div>
                                     {hasU && <div className="mt-1 text-xs font-black bg-gray-800 text-white rounded px-2 py-0.5">{item.currentStockUnits}</div>}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                    Base Cost: ₦{Number(item.costPrice).toFixed(2)}
                                </div>
                                <button 
                                     onClick={() => setRestockingItem(item)}
                                     className="flex items-center text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                     <Truck className="h-3 w-3 mr-1.5"/> Restock
                                </button>
                            </div>
                        </div>
                     );
                })}
            </div>
            
            {restockingItem && (
                <RestockModal 
                    item={restockingItem} 
                    onClose={() => setRestockingItem(null)} 
                    onSuccess={fetchItems} 
                />
            )}
        </div>
  );
}
