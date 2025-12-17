'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '@/components/PageHeader';
import { Search, User, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    _count?: { invoices: number };
};

type Invoice = {
    id: string;
    invoiceNumber: number;
    totalAmount: string;
    createdAt: string;
    sales: any[];
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [history, setHistory] = useState<Invoice[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${API_URL}/customers?search=${search}`);
            setCustomers(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async (id: string) => {
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${API_URL}/customers/${id}/history`);
            setHistory(res.data.invoices);
        } catch (e) { console.error(e); }
        finally { setLoadingHistory(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8 animate-fade-in">
             <PageHeader 
                title="Customer Database" 
                subtitle="Manage client profiles and view purchase history."
             />

             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                 <div className="flex flex-col lg:flex-row gap-8">
                     
                     {/* LEFT: Customer List */}
                     <div className="lg:w-1/3 flex flex-col gap-6">
                         {/* Search */}
                         <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                             <input 
                                type="text" 
                                placeholder="Search Name or Phone..." 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-bold text-gray-900"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                             />
                         </div>

                         {/* List */}
                         <div className="space-y-3">
                             {customers.map(c => (
                                 <div 
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedCustomer(c);
                                        fetchHistory(c.id);
                                    }}
                                    className={`p-4 bg-white border rounded-xl cursor-pointer hover:shadow-md transition-all group ${selectedCustomer?.id === c.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                 >
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <h3 className="font-bold text-gray-900 group-hover:text-blue-600">{c.name}</h3>
                                             <div className="flex flex-col gap-1 mt-1">
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <Phone className="h-3 w-3" /> {c.phone}
                                                    </div>
                                                )}
                                                {c.address && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <MapPin className="h-3 w-3" /> {c.address}
                                                    </div>
                                                )}
                                             </div>
                                         </div>
                                         <div className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                             {c._count?.invoices || 0} Sales
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {customers.length === 0 && (
                                 <div className="text-center py-10 text-gray-400 italic">No customers found</div>
                             )}
                         </div>
                     </div>

                     {/* RIGHT: History / Details */}
                     <div className="lg:w-2/3">
                         {selectedCustomer ? (
                             <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
                                 <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                     <h2 className="text-3xl font-black text-gray-900 mb-2">{selectedCustomer.name}</h2>
                                     <div className="flex gap-6 text-sm text-gray-500 font-medium">
                                         {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                                         {selectedCustomer.address && <span>{selectedCustomer.address}</span>}
                                         <span>Joined: {new Date().toLocaleDateString()}</span>
                                     </div>
                                 </div>

                                 <div className="p-8">
                                     <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                         <FileText className="h-5 w-5 text-gray-400" /> Purchase History
                                     </h3>

                                     {loadingHistory ? (
                                         <div className="animate-pulse space-y-4">
                                             {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>)}
                                         </div>
                                     ) : (
                                         <div className="space-y-4">
                                             {history.map(inv => (
                                                 <div key={inv.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                                     <div className="flex justify-between items-center mb-4 border-b border-dashed border-gray-200 pb-3">
                                                         <div>
                                                             <div className="font-bold text-gray-900">Invoice #{inv.invoiceNumber}</div>
                                                             <div className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleString()}</div>
                                                         </div>
                                                         <div className="text-xl font-black text-gray-900">
                                                             ₦{Number(inv.totalAmount).toLocaleString()}
                                                         </div>
                                                     </div>
                                                     
                                                     {/* Mini Items Table */}
                                                     <div className="space-y-2">
                                                         {inv.sales.map((sale: any) => (
                                                             <div key={sale.id} className="flex justify-between text-sm text-gray-600">
                                                                 <div className="flex gap-2">
                                                                     <span className="font-bold text-gray-800">{sale.quantity} x</span>
                                                                     <span>{sale.item.name}</span>
                                                                     <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded uppercase">{sale.saleType}</span>
                                                                 </div>
                                                                 <div className="font-medium">₦{Number(sale.totalAmount).toLocaleString()}</div>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             ))}
                                             {history.length === 0 && (
                                                 <div className="text-center py-12 text-gray-400">
                                                     No purchase history found for this customer.
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-12 min-h-[400px]">
                                 <User className="h-16 w-16 mb-4 opacity-20" />
                                 <p className="font-medium">Select a customer to view their profile</p>
                             </div>
                         )}
                     </div>
                 </div>
             </div>
        </div>
    );
}
