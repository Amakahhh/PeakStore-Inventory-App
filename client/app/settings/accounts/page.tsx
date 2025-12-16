'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Plus, CreditCard, Wallet, Landmark, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Account = {
  id: string;
  name: string;
  type: string;
  details: string;
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  const [formData, setFormData] = useState({
      name: '',
      type: 'POS_TERMINAL',
      details: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
        const res = await axios.get(`${API_URL}/accounts`);
        setAccounts(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm('Delete this account?')) return;
      try {
          await axios.delete(`${API_URL}/accounts/${id}`);
          fetchAccounts();
      } catch(e) { alert('Failed to delete'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await axios.post(`${API_URL}/accounts`, formData);
          setFormData({ name: '', type: 'POS_TERMINAL', details: '' });
          setShowAdd(false);
          fetchAccounts();
      } catch(e) { alert('Failed to create account'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-6 animate-fade-in">
       <PageHeader 
          title="Payment Accounts" 
          subtitle="Configure POS terminals and bank accounts"
          action={
              !showAdd ? (
                <button 
                    onClick={() => setShowAdd(true)}
                    className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 shadow-lg transition-transform active:scale-95 font-bold text-sm"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </button>
              ) : null
          }
       />

       <div className="max-w-4xl mx-auto">
           {showAdd && (
               <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 border border-gray-100 animate-slide-up relative">
                   <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X className="h-5 w-5"/></button>
                   <h2 className="text-xl font-black mb-6 text-gray-900 border-b pb-4">Add New Account</h2>
                   <form onSubmit={handleSubmit} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Name</label>
                               <input 
                                   className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition font-bold outline-none" 
                                   placeholder="e.g. Moniepoint POS 1" 
                                   value={formData.name} 
                                   onChange={e => setFormData({...formData, name: e.target.value})} 
                                   required 
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Type</label>
                               <div className="relative">
                                    <select 
                                        className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition font-bold outline-none appearance-none" 
                                        value={formData.type} 
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="POS_TERMINAL">POS Terminal</option>
                                        <option value="BANK_ACCOUNT">Bank Account</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                               </div>
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Details (Optional)</label>
                           <input 
                                className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition font-medium outline-none" 
                                placeholder="e.g. Terminal ID or Account Number" 
                                value={formData.details} 
                                onChange={e => setFormData({...formData, details: e.target.value})} 
                           />
                       </div>
                       <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                           <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">Cancel</button>
                           <button type="submit" className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-bold shadow-lg transition-transform active:scale-95">Save Account</button>
                       </div>
                   </form>
               </div>
           )}

            <div className="grid grid-cols-1 gap-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center group hover:border-black transition-colors">
                        <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                            <div className={`p-4 rounded-xl mr-6 ${acc.type === 'BANK_ACCOUNT' ? 'bg-gray-100 text-gray-600' : 'bg-black text-white'}`}>
                                {acc.type === 'BANK_ACCOUNT' ? <Landmark size={24} /> : <Wallet size={24} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{acc.name}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded text-gray-500">{acc.type.replace('_', ' ')}</span>
                                    {acc.details && <span className="text-sm text-gray-400 font-medium">• {acc.details}</span>}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(acc.id)} 
                            className="w-full md:w-auto p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center"
                            title="Delete Account"
                        >
                            <Trash2 size={20} /> <span className="md:hidden ml-2 font-bold">Delete</span>
                        </button>
                    </div>
                ))}
            </div>

            {accounts.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No accounts configured</h3>
                    <p className="text-gray-500 font-medium">Add a checkout terminal or bank account to get started.</p>
                </div>
            )}
       </div>
    </div>
  );
}
