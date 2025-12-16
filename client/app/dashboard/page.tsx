'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Package, ShoppingCart, TrendingUp, Wallet, ArrowRight, DollarSign, Users } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ revenue: 0, orders: 0 });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setUser(session.user);
        fetchStats();
      }
    };
    getUser();
  }, [router]);

  const fetchStats = async () => {
    try {
        const res = await axios.get(`${API_URL}/sales/daily`);
        const totalRevenue = res.data.reduce((sum: number, sale: any) => sum + Number(sale.totalAmount), 0);
        setStats({ revenue: totalRevenue, orders: res.data.length });
    } catch (e) {
        console.error(e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return <div className="p-10 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Peak<span className="text-blue-600">Store</span></h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Dashboard</p>
        </div>
        <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </button>
      </header>
    
      <main className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Welcome / Quick Stats */}
        <div className="bg-black text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome, {user.user_metadata?.display_name || 'Manager'}</h2>
                <div className="flex space-x-6 mt-4">
                    
                </div>
            </div>
             {/* Decorative */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>

        {/* Main Options Grid - MONOCHROME STYLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales */}
            <div 
                onClick={() => router.push('/sales')}
                className="group bg-white p-10 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-black hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-6 w-6 text-black" />
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <ShoppingCart className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">New Sale </h2>
                <p className="text-gray-500 font-medium">Record transactions and manage cart.</p>
            </div>

            {/* Inventory */}
            <div 
                 onClick={() => router.push('/inventory')}
                 className="group bg-white p-10 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-black hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-6 w-6 text-black" />
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <Package className="h-8 w-8" />
                </div>
                 <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Inventory</h2>
                 <p className="text-gray-500 font-medium">Manage products, prices, and stock.</p>
            </div>

            {/* History */}
            <div 
                 onClick={() => router.push('/history')}
                 className="group bg-white p-10 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-black hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-6 w-6 text-black" />
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <TrendingUp className="h-8 w-8" />
                </div>
                 <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Sales History</h2>
                 <p className="text-gray-500 font-medium">View past orders and daily reports.</p>
            </div>

            {/* Financials */}
            <div 
                 onClick={() => router.push('/finance')}
                 className="group bg-white p-10 rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-black hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-6 w-6 text-black" />
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <Wallet className="h-8 w-8" />
                </div>
                 <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Financials</h2>
                 <p className="text-gray-500 font-medium">Track accounts and transfers.</p>
            </div>
        </div>
      </main>
    </div>
  );
}
