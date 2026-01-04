'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Package, Wallet, DollarSign, RefreshCw } from 'lucide-react';
import AuthSync from '@/components/AuthSync';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ShopWorthPage() {
    const [worthData, setWorthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchWorth = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/accounts/worth`);
            setWorthData(res.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch shop worth:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorth();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value).replace('NGN', '₦');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-6 animate-fade-in">
            <AuthSync />
            <PageHeader 
                title="Shop Worth" 
                subtitle="Track your business growth and total value"
                action={
                    <button 
                        onClick={fetchWorth}
                        disabled={loading}
                        className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 shadow-lg transition-transform active:scale-95 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                }
            />

            {loading && !worthData ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                </div>
            ) : worthData ? (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Main Worth Card */}
                    <div className="bg-gradient-to-br from-black to-gray-800 text-white p-8 rounded-3xl shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="bg-white/20 p-3 rounded-xl mr-4">
                                    <TrendingUp className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-white/70 font-bold text-sm uppercase tracking-widest">Total Shop Worth</p>
                                    <p className="text-xs text-white/50 mt-1">Inventory + Cash</p>
                                </div>
                            </div>
                            {lastUpdated && (
                                <p className="text-xs text-white/50">
                                    Updated {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <div className="text-5xl md:text-6xl font-black tracking-tight">
                            {formatCurrency(worthData.shopWorth)}
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inventory Value Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                                    <Package className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Inventory Value</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Stock at Cost Price</p>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-gray-900">
                                {formatCurrency(worthData.inventoryValue)}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">% of Total Worth</span>
                                    <span className="font-bold text-gray-900">
                                        {worthData.shopWorth > 0 
                                            ? ((worthData.inventoryValue / worthData.shopWorth) * 100).toFixed(1) 
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cash in Hand Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-3 rounded-xl mr-4">
                                    <Wallet className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Cash in Accounts</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Bank + POS + Cash</p>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-gray-900">
                                {formatCurrency(worthData.cashInHand)}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">% of Total Worth</span>
                                    <span className="font-bold text-gray-900">
                                        {worthData.shopWorth > 0 
                                            ? ((worthData.cashInHand / worthData.shopWorth) * 100).toFixed(1) 
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <div className="flex items-start">
                            <DollarSign className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">How is Shop Worth calculated?</h4>
                                <p className="text-sm text-blue-700">
                                    <strong>Inventory Value</strong> = Total units in stock × Cost price per unit<br/>
                                    <strong>Cash in Accounts</strong> = Sales revenue - Restock costs - Withdrawals + Transfers in<br/>
                                    <strong>Shop Worth</strong> = Inventory Value + Cash in Accounts
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Growth Tip */}
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-6">
                        <h4 className="font-bold text-lg mb-2">📈 Track Your Growth</h4>
                        <p className="text-white/80 text-sm">
                            Check this page regularly to monitor your shop's growth. As you make sales and restock wisely, 
                            your total worth should steadily increase over time. Take note of today's value and compare it 
                            in 2 weeks to see your progress!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <p className="font-bold text-lg">Unable to load shop worth data</p>
                    <button onClick={fetchWorth} className="mt-4 text-black underline font-bold">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
