import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bot, Activity, Zap } from "lucide-react";

export default function SuperAdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Global Overview</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Welcome to the Media2AI Super Admin control panel.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Total Tenants Card */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Tenants</CardTitle>
                        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">128</div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+4 this month</p>
                    </CardContent>
                </Card>

                {/* Active Agents Card */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active AI Agents</CardTitle>
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">1,420</div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+12% from last week</p>
                    </CardContent>
                </Card>

                {/* API Calls Card */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">API Calls (24h)</CardTitle>
                        <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">84.2k</div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Stable traffic</p>
                    </CardContent>
                </Card>

                {/* System Health Card */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">System Health</CardTitle>
                        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">99.9%</div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">All systems operational</p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}