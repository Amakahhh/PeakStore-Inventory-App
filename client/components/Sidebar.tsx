'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, History, Wallet, LogOut, X } from 'lucide-react';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Sale', href: '/sales', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'History', href: '/history', icon: History },
    { name: 'Financials', href: '/finance', icon: Wallet },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-80 z-20 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container - BLACK BACKGROUND */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-72 bg-black text-white transform transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:inset-auto md:h-screen md:flex md:flex-col shadow-2xl
            `}>
                {/* Logo Area */}
                <div className="flex items-center justify-between p-8 border-b border-gray-900">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-black font-extrabold text-xl">P</span>
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight text-white block">Peak<span className="text-blue-500">Store</span></span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Manager</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        
                        return (
                            <Link 
                                key={item.name} 
                                href={item.href}
                                onClick={() => { if(window.innerWidth < 768) onClose() }}
                                className={`
                                    flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group
                                    ${isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                        : 'text-gray-400 hover:bg-gray-900 hover:text-white hover:pl-6'}
                                `}
                            >
                                <Icon className={`mr-4 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User/Logout */}
                <div className="p-6 border-t border-gray-900 bg-gray-950">
                    <div className="flex items-center mb-4 px-2">
                       <div className="h-8 w-8 rounded-full bg-gray-800 border border-gray-700 items-center justify-center flex text-xs font-bold text-gray-300">
                           AD
                       </div>
                       <div className="ml-3">
                           <p className="text-sm font-medium text-white">Admin User</p>
                           <p className="text-xs text-gray-500">Store Manager</p>
                       </div>
                    </div>
                    <button className="flex items-center w-full px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 bg-gray-900 rounded-lg hover:bg-red-950/30 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-900">
                        <LogOut className="mr-3 h-4 w-4" />
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}
