'use client';
import { Menu, Bell, Search } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10 w-full">
            {/* Left: Mobile Menu & Search */}
            <div className="flex items-center w-full max-w-xl">
                <button 
                    onClick={onMenuClick}
                    className="p-2 -ml-2 mr-4 text-gray-500 rounded-lg md:hidden hover:bg-black hover:text-white transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                
                {/* Elegant Search Bar */}
                <div className="hidden md:flex items-center w-full max-w-md bg-gray-50 rounded-full px-4 py-2.5 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all duration-300">
                    <Search className="h-4 w-4 text-gray-400 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search items, orders, or customers..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-800 placeholder-gray-400 font-medium"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-6">
                <button className="p-2 text-gray-400 hover:text-black transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-blue-600 rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>
    );
}
