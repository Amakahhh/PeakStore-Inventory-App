'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 md:px-12">
                    {children}
                </main>
            </div>
        </div>
    );
}
