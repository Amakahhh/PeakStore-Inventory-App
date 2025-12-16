'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, ArrowLeft, Calendar, User, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import PageHeader from '@/components/PageHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function HistoryPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/invoices`);
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const [selectedDate, setSelectedDate] = useState('');

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = (inv.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                              String(inv.invoiceNumber).includes(searchTerm);
        
        const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
        const matchesDate = selectedDate ? invDate === selectedDate : true;

        return matchesSearch && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20 animate-fade-in">
            <PageHeader 
                title="Sales History" 
                subtitle="View and manage past transactions"
            />

            {/* Controls */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input 
                        type="text" 
                        placeholder="Search by Customer Name or Invoice #..." 
                        className="w-full pl-12 p-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input 
                        type="date" 
                        className="w-full pl-12 p-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition font-medium text-gray-600"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden md:block max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredInvoices.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-gray-100 rounded-lg mr-3 text-gray-500">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <span className="font-bold text-gray-900">#{inv.invoiceNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">{inv.customerName || 'Walk-in'}</div>
                                    {inv.user && <div className="text-xs text-gray-400 font-medium mt-0.5">By: {inv.user.name}</div>}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">{new Date(inv.createdAt).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm font-black text-gray-900">₦{Number(inv.totalAmount).toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border 
                                        ${inv.paymentMethod === 'CASH' ? 'bg-gray-100 text-gray-700 border-gray-200' : 
                                          inv.paymentMethod === 'POS' ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-300'}`}>
                                        {inv.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="text-gray-400 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards (Visible on Mobile) */}
            <div className="md:hidden space-y-4">
                {filteredInvoices.map((inv: any) => (
                    <div key={inv.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 active:scale-[0.99] transition-transform" onClick={() => setSelectedInvoice(inv)}>
                        <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center">
                                 <div className="bg-gray-50 p-2 rounded-lg mr-3 border border-gray-100">
                                     <FileText className="h-5 w-5 text-gray-500" />
                                 </div>
                                 <div>
                                     <div className="text-sm font-black text-gray-900">#{inv.invoiceNumber}</div>
                                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(inv.createdAt).toLocaleDateString()}</div>
                                 </div>
                             </div>
                             <span className={`px-2 py-1 text-[10px] font-bold rounded-md border 
                                ${inv.paymentMethod === 'CASH' ? 'bg-gray-100 text-gray-700 border-gray-200' : 
                                  inv.paymentMethod === 'POS' ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-300'}`}>
                                    {inv.paymentMethod}
                             </span>
                        </div>
                        
                        <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                             <div>
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Customer</div>
                                 <div className="text-sm font-bold text-gray-900">{inv.customerName || 'Walk-in'}</div>
                                 <div className="text-[10px] text-gray-400 mt-1">By: {inv.user?.name || 'Staff'}</div>
                             </div>
                             <div className="text-right">
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</div>
                                 <div className="text-xl font-black text-gray-900">₦{Number(inv.totalAmount).toLocaleString()}</div>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredInvoices.length === 0 && (
                <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No invoices found</h3>
                    <p className="text-gray-500">Try adjusting your search or date filter.</p>
                </div>
            )}

            {/* Modal */}
            {selectedInvoice && (
                <InvoiceTemplate 
                    invoice={selectedInvoice} 
                    onClose={() => setSelectedInvoice(null)} 
                />
            )}
        </div>
    );
}
