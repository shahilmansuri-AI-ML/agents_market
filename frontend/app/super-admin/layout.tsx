"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Globe, Users, ShieldAlert, LogOut } from 'lucide-react';
import { toast } from "sonner";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Cookie delete karne ke liye ek API call ya document.cookie approach use kar sakte hain
        document.cookie = "super_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        toast.success("Super Admin logged out successfully");
        router.push('/login'); // Wapas normal login page par bhej dega
    };

    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-20">
                <div className="p-6 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <span className="font-bold text-lg">
                        Media2AI <span className="text-[10px] font-bold tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 dark:bg-indigo-900/50 dark:text-indigo-400">ADMIN</span>
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <Link href="/super-admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname === '/super-admin' ? 'bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
                        <LayoutDashboard size={18} /> Overview
                    </Link>
                    <Link href="/super-admin/tenants" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname.includes('/tenants') ? 'bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
                        <Globe size={18} /> Tenants
                    </Link>
                    <Link href="/super-admin/users" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname.includes('/users') ? 'bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
                        <Users size={18} /> Users
                    </Link>
                    <Link href="/super-admin/audit" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname.includes('/audit') ? 'bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
                        <ShieldAlert size={18} /> Audit Logs
                    </Link>
                </nav>

                {/* Logout Section */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm transition text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-end px-8 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Super Admin</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm cursor-pointer border border-indigo-200 dark:bg-indigo-900 dark:border-indigo-800 dark:text-indigo-300">
                            SA
                        </div>
                    </div>
                </header>

                {/* Child Pages Load Here */}
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}