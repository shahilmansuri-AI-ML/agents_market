"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Bot, Activity, TrendingUp, HardDrive, Users, Key, Calendar, Clock, Loader2 } from "lucide-react";

interface AccountStats {
  agents_created: number;
  total_executions: number;
  api_calls_this_month: number;
  storage_used_gb: number;
  team_members: number;
  api_keys_active: number;
  member_since: string;
  last_login: string | null;
}

export default function AccountOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is super admin - redirect to main profile page
    const superAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('super_admin_email') : null;
    if (superAdminEmail) {
      toast.info("Account Overview is not available for Super Admins");
      router.push('/dashboard/profile');
      return;
    }
    
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const data = await api.get("/profile/stats", { requireAuth: true });
      setStats(data);
    } catch (error) {
      toast.error("Failed to load account statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Agents Created",
      value: stats?.agents_created || 0,
      icon: Bot,
      description: "Total AI agents deployed",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Executions",
      value: stats?.total_executions.toLocaleString() || "0",
      icon: Activity,
      description: "All-time agent runs",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "API Calls This Month",
      value: stats?.api_calls_this_month.toLocaleString() || "0",
      icon: TrendingUp,
      description: "Current billing period",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Storage Used",
      value: `${stats?.storage_used_gb.toFixed(2) || "0.00"} GB`,
      icon: HardDrive,
      description: "Data and configurations",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Team Members",
      value: stats?.team_members || 0,
      icon: Users,
      description: "Active users in workspace",
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
    {
      title: "API Keys",
      value: stats?.api_keys_active || 0,
      icon: Key,
      description: "Active API credentials",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
    },
  ];

  return (
    <div className="flex flex-col py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Account Overview</h1>
        <p className="text-[var(--text-secondary)] mt-2">Your account statistics and activity summary</p>
      </div>

      <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-primary)]">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account Details */}
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-[var(--text-primary)]">Account Information</CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">Your account timeline and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <Calendar className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Member Since</p>
                <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">
                  {stats?.member_since ? new Date(stats.member_since).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : "N/A"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats?.member_since ? `${Math.floor((new Date().getTime() - new Date(stats.member_since).getTime()) / (1000 * 60 * 60 * 24))} days ago` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Last Login</p>
                <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">
                  {stats?.last_login ? new Date(stats.last_login).toLocaleDateString('en-IN', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                  }) : "N/A"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats?.last_login ? new Date(stats.last_login).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true
                  }) : ""}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-[var(--text-primary)]">Usage Summary</CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">Your platform activity overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-primary)]">Average agents per workspace</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {stats?.team_members ? (stats.agents_created / Math.max(stats.team_members, 1)).toFixed(1) : "0"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-primary)]">Executions per agent</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {stats?.agents_created ? (stats.total_executions / Math.max(stats.agents_created, 1)).toFixed(0) : "0"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-primary)]">API calls per day (this month)</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {stats?.api_calls_this_month ? (stats.api_calls_this_month / new Date().getDate()).toFixed(0) : "0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
