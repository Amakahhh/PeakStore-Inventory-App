'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function RestockModal({ item, onClose, onSuccess }: any) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [unitType, setUnitType] = useState('WHOLESALE'); // WHOLESALE (Carton) or ROLL
    const [quantity, setQuantity] = useState(1);
    const [costPrice, setCostPrice] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_URL}/accounts`);
            setAccounts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRestock = async () => {
        if (!costPrice) return alert("Please enter Cost Price");
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert("User not authenticated. Please login again.");

            await axios.post(`${API_URL}/items/restock`, {
                itemId: item.id,
                userId: user.id,
                quantity,
                unitType,
                costPrice,
                paymentAccountId: paymentAccountId || null,
                notes
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert("Restock failed: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 animate-slide-up relative">
                 <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-black text-gray-900">Restock Item</h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{item.name}</p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unit Type</label>
                            <select 
                                value={unitType} 
                                onChange={e => setUnitType(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none transition-all"
                            >
                                <option value="WHOLESALE">Cartons</option>
                                {item.rollsPerCarton > 0 && <option value="ROLL">Rolls/Packs</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quantity</label>
                            <input 
                                type="number" min="1"
                                value={quantity} 
                                onChange={e => setQuantity(Number(e.target.value))}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Cost Price (Per Unit)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 font-bold text-gray-400">₦</span>
                            <input 
                                type="number" placeholder="0.00"
                                value={costPrice} 
                                onChange={e => setCostPrice(e.target.value)}
                                className="w-full pl-8 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Source</label>
                        <select 
                            value={paymentAccountId} 
                            onChange={e => setPaymentAccountId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none transition-all"
                        >
                            <option value="">No Payment / Credit</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                        {paymentAccountId && <p className="text-[10px] font-bold text-blue-500 mt-2 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Cost will be deducted from this account</p>}
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Notes</label>
                        <input 
                            type="text"
                            placeholder="Optional reference..."
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-black outline-none transition-all text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleRestock}
                        className="w-full bg-black text-white p-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-gray-900 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex justify-center items-center"
                    >
                        <Save className="mr-2 h-4 w-4" /> Confirm Restock
                    </button>
                </div>
            </div>
        </div>
    );
}
