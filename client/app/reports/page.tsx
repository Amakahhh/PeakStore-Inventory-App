'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ReportsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
         try {
             const res = await axios.get(`${API_URL}/sales/today`);
             setSales(res.data);
         } catch(e) { console.error('Failed to load sales'); }
         finally { setLoading(false); }
    };
    fetchSales();
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
       <header className="flex items-center mb-6">
          <button onClick={() => router.push('/dashboard')} className="p-2 mr-4 bg-white shadow rounded-full"><ArrowLeft /></button>
          <h1 className="text-xl font-bold">Daily Report</h1>
       </header>

       <div className="max-w-4xl mx-auto">
           {/* Summary Card */}
           <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg mb-8">
               <div className="flex items-center justify-between">
                    <div>
                        <p className="text-purple-100 text-sm mb-1">Total Sales Today</p>
                        <h2 className="text-4xl font-bold">{formatCurrency(totalRevenue)}</h2>
                    </div>
                    <TrendingUp className="h-16 w-16 opacity-50" />
               </div>
               <p className="mt-4 text-sm opacity-80">{sales.length} transactions recorded</p>
           </div>

           {/* List */}
           <div className="bg-white rounded-lg shadow overflow-hidden">
               <h3 className="p-4 border-b font-bold text-gray-700">Transaction History</h3>
               {loading ? (
                   <p className="p-4 text-center text-gray-500">Loading...</p>
               ) : (
                   <div className="divide-y">
                       {sales.length === 0 ? <p className="p-8 text-center text-gray-500">No sales yet today.</p> :
                        sales.map(sale => (
                           <div key={sale.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                               <div>
                                   <p className="font-bold text-gray-800">{sale.item?.name || 'Unknown Item'}</p>
                                   <p className="text-sm text-gray-500">
                                       {sale.quantity} x {sale.saleType === 'WHOLESALE' ? 'Carton' : 'Unit'} 
                                       <span className="mx-2">•</span> 
                                       {new Date(sale.createdAt).toLocaleTimeString()}
                                   </p>
                               </div>
                               <div className="font-bold text-gray-900">
                                   {formatCurrency(Number(sale.totalAmount))}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       </div>
    </div>
  );
}
