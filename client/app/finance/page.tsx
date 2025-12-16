'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Landmark, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function FinancePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [showTransfer, setShowTransfer] = useState(false);
    
    // Transfer State
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [isWithdrawal, setIsWithdrawal] = useState(false);
    const [notes, setNotes] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [profitStats, setProfitStats] = useState<any>(null);

    useEffect(() => {
        fetchBalances();
        fetchProfit();
    }, []);

    const fetchBalances = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/accounts/balances`);
            setAccounts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfit = async () => {
        try {
            const res = await axios.get(`${API_URL}/accounts/profit`);
            setProfitStats(res.data);
        } catch (error) {
            console.error("Profit Fetch Error:", error);
        }
    };

    const handleTransfer = async () => {
        if (!fromAccount || !amount) return alert("Please fill details");
        if (!isWithdrawal && !toAccount) return alert("Select destination account");

        try {
            await axios.post(`${API_URL}/accounts/transfer`, {
                userId: '74514578-831e-4581-9877-c990a4247545', // Ideally from AuthContext
                fromAccountId: fromAccount,
                toAccountId: isWithdrawal ? null : toAccount,
                amount: Number(amount),
                isWithdrawal,
                notes
            });
            setShowTransfer(false);
            fetchBalances();
            alert("Transfer Successful");
            setAmount(''); setNotes('');
        } catch (error) {
            console.error(error);
            alert("Transfer failed");
        }
    };

    return (

        <div className="min-h-screen bg-gray-50 pb-20 md:p-6 p-4 animate-fade-in">
            <PageHeader 
                title="Financials" 
                subtitle="Overview of accounts and balances"
                action={
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => router.push('/settings/accounts')}
                            className="flex-1 md:flex-none justify-center bg-white text-gray-700 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 flex items-center border border-gray-200 transition"
                        >
                            <Settings className="mr-2 h-4 w-4" /> Manage Accounts
                        </button>
                        <button 
                            onClick={() => setShowTransfer(true)}
                            className="flex-1 md:flex-none justify-center bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 flex items-center transition transform active:scale-95"
                        >
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Move Money
                        </button>
                    </div>
                }
            />

            {/* Profit Summary Card */}
            {profitStats && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                             <TrendingUp className="h-32 w-32" />
                         </div>
                         <div className="relative z-10">
                             <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Total Profit</h2>
                             <div className="text-4xl font-black tracking-tighter mb-2">
                                 ₦{Number(profitStats.totalProfit).toLocaleString()}
                             </div>
                             <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                                 {profitStats.margin}% Margin
                             </div>
                         </div>
                    </div>

                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
                         <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Revenue</h2>
                         <div className="text-3xl font-black text-gray-900 tracking-tight">
                             ₦{Number(profitStats.totalRevenue).toLocaleString()}
                         </div>
                     </div>

                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
                         <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Cost of Goods</h2>
                         <div className="text-3xl font-black text-gray-900 tracking-tight">
                             ₦{Number(profitStats.totalCost).toLocaleString()}
                         </div>
                     </div>
                </div>
            )}

            {/* Account Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {accounts.map(acc => {
                        const balance = Number(acc.stats?.netBalance || 0);
                        const isPositive = balance >= 0;
                        
                        return (
                            <div key={acc.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 flex flex-col h-full overflow-hidden group">
                                <div className="p-6 border-b border-gray-100 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${acc.type === 'BANK' ? 'bg-gray-100 text-gray-600' : 'bg-black text-white'}`}>
                                                 {acc.type === 'BANK' ? <Landmark className="h-5 w-5"/> : <Wallet className="h-5 w-5"/>}
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-gray-900 truncate max-w-[150px]" title={acc.name}>{acc.name}</h2>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{acc.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-black text-gray-900 tracking-tight block truncate" title={`₦${balance.toLocaleString()}`}>
                                            ₦{balance.toLocaleString()}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">Available Balance</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 divide-x divide-gray-100 bg-gray-50 flex-1">
                                    <div className="p-4 flex flex-col justify-center">
                                        <span className="text-gray-400 text-[10px] font-bold flex items-center mb-1 uppercase tracking-wide">
                                            Income
                                        </span>
                                        <div className="font-bold text-sm text-gray-900 truncate flex items-center">
                                            <TrendingUp className="h-3 w-3 mr-1 text-gray-400"/> +₦{Number(acc.stats?.totalSales || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col justify-center">
                                        <span className="text-gray-400 text-[10px] font-bold flex items-center mb-1 uppercase tracking-wide">
                                            Expenses
                                        </span>
                                        <div className="font-bold text-sm text-gray-900 truncate flex items-center">
                                            <TrendingDown className="h-3 w-3 mr-1 text-gray-400"/> -₦{Number(acc.stats?.totalPurchases || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 w-full md:max-w-md animate-slide-up md:animate-fade-in-up max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-black text-gray-900">Move Money</h2>
                            <button onClick={() => setShowTransfer(false)} className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors text-gray-400">✕</button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">From Account</label>
                                <div className="relative">
                                    <select 
                                        value={fromAccount} 
                                        onChange={e => setFromAccount(e.target.value)}
                                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition font-bold appearance-none"
                                    >
                                        <option value="">Select Source Account</option>
                                        {accounts.filter(a => Number(a.stats?.netBalance || 0) > 0).map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} — ₦{Number(acc.stats?.netBalance).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ArrowRightLeft className="h-4 w-4 text-gray-400 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-1.5 rounded-xl flex border border-gray-100">
                                <button 
                                    onClick={() => setIsWithdrawal(false)}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${!isWithdrawal ? 'bg-white text-black shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Internal Transfer
                                </button>
                                <button 
                                    onClick={() => setIsWithdrawal(true)}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${isWithdrawal ? 'bg-white text-black shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Withdrawal
                                </button>
                            </div>

                            {!isWithdrawal && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">To Account</label>
                                    <div className="relative">
                                        <select 
                                            value={toAccount} 
                                            onChange={e => setToAccount(e.target.value)}
                                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition font-bold appearance-none"
                                        >
                                            <option value="">Select Destination</option>
                                            {accounts.filter(a => a.id !== fromAccount).map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ArrowRightLeft className="h-4 w-4 text-gray-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full pl-10 p-4 border border-gray-200 rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-black transition bg-gray-50 focus:bg-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Note / Description</label>
                                <input 
                                    type="text" 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition bg-gray-50 focus:bg-white font-medium"
                                    placeholder="e.g. Daily Deposit"
                                />
                            </div>

                            <button 
                                onClick={handleTransfer}
                                className="w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transform transition active:scale-[0.98] uppercase tracking-widest text-sm"
                            >
                                Confirm {isWithdrawal ? 'Withdrawal' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

