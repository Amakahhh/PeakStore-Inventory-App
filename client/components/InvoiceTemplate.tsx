'use client';
import { useRef } from 'react';
import html2canvas from 'html2canvas'; // Ensure this is installed
import { Download, X } from 'lucide-react';

type InvoiceProps = {
    invoice: any;
    onClose: () => void;
};

export default function InvoiceTemplate({ invoice, onClose }: InvoiceProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (invoiceRef.current) {
            try {
                const canvas = await html2canvas(invoiceRef.current, {
                    scale: 2, // Better quality
                    useCORS: true,
                    logging: true,
                    backgroundColor: '#ffffff'
                });
                const dataMap = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataMap;
                link.download = `Invoice-${invoice.invoiceNumber}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error("Download failed:", err);
                alert("Failed to generate image. Please try again.");
            }
        }
    };

    if (!invoice) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
                {/* Controls */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-gray-700">Invoice #{invoice.invoiceNumber}</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 text-sm font-bold"
                        >
                            <Download className="h-4 w-4 mr-2" /> Download Image
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 text-red-600 rounded">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Invoice Content (Target for Image Generation) */}
                <div className="p-8 bg-white" ref={invoiceRef}>
                    <div className="border-b-2 border-gray-800 pb-4 mb-4 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">PEAK STORES</h1>
                            <p className="text-gray-500 text-sm mt-1">Quality Wholesale & Retail</p>
                            <p className="text-gray-500 text-sm">Lagos, Nigeria</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">INVOICE</div>
                            <div className="text-gray-600">#{invoice.invoiceNumber}</div>
                            <div className="text-sm text-gray-500 mt-2">
                                Date: {new Date(invoice.createdAt).toLocaleDateString()} <br/>
                                Time: {new Date(invoice.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex justify-between">
                         <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Bill To</span>
                            <div className="text-lg font-bold text-gray-800">{invoice.customerName || 'Walk-in Customer'}</div>
                            {invoice.notes && <div className="text-sm text-gray-600 italic mt-1">"{invoice.notes}"</div>}
                         </div>
                         <div className="text-right">
                             <div className="text-xs font-bold text-gray-400 uppercase">Payment</div>
                             <div className="font-semibold text-gray-800">{invoice.paymentMethod}</div>
                             {invoice.paymentAccount && <div className="text-xs text-gray-500">{invoice.paymentAccount.name}</div>}
                             <div className="text-xs text-gray-400 mt-2">Served By: {invoice.user?.name || 'Staff'}</div>
                         </div>
                    </div>

                    <table className="w-full text-left mb-6">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="py-2 text-sm font-bold text-gray-600 uppercase">Item</th>
                                <th className="py-2 text-sm font-bold text-gray-600 uppercase text-center">Unit</th>
                                <th className="py-2 text-sm font-bold text-gray-600 uppercase text-center">Qty</th>
                                <th className="py-2 text-sm font-bold text-gray-600 uppercase text-right">Price</th>
                                <th className="py-2 text-sm font-bold text-gray-600 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.sales.map((sale: any) => (
                                <tr key={sale.id}>
                                    <td className="py-3">
                                        <div className="font-bold text-gray-800">{sale.item.name}</div>
                                    </td>
                                    <td className="py-3 text-center text-sm text-gray-500">{sale.saleType}</td>
                                    <td className="py-3 text-center font-bold text-gray-800">{sale.quantity}</td>
                                    <td className="py-3 text-right text-gray-600">₦{Number(sale.priceAtTime).toLocaleString()}</td>
                                    <td className="py-3 text-right font-bold text-gray-800">₦{Number(sale.totalAmount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t-2 border-gray-800 pt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Thanks for your patronage! <br/>
                            Goods bought in good condition are not returnable.
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500 font-bold uppercase">Grand Total</div>
                            <div className="text-3xl font-extrabold text-blue-900">₦{Number(invoice.totalAmount).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
