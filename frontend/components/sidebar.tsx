"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { permissions } from "@/lib/permissions";
import {
  Bot,
  Workflow,
  Wrench,
  MessageSquare,
  Users,
  Shield,
  Mail,
  Key,
  FileText,
  Settings,
  ChevronDown,
  Home,
  Store,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  permission?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [adminOpen, setAdminOpen] = useState(true);

  const mainNav: NavSection[] = [
    {
      items: [
        { title: "Dashboard", href: "/dashboard", icon: Home },
        { title: "AI Marketplace", href: "/dashboard/agent-registry", icon: Store },
        { title: "Agents", href: "/dashboard/agents", icon: Bot },
        { title: "Workflows", href: "/dashboard/workflows", icon: Workflow },
        { title: "Tools", href: "/dashboard/tools", icon: Wrench },
        { title: "Chat", href: "/chat-us", icon: MessageSquare },
      ],
    },
  ];

  const adminNav: NavItem[] = [
    { title: "Users", href: "/dashboard/admin/users", icon: Users },
    { title: "Roles", href: "/dashboard/admin/roles", icon: Shield },
    { title: "Invitations", href: "/dashboard/admin/invitations", icon: Mail },
    { title: "API Keys", href: "/dashboard/admin/api-keys", icon: Key },
    { title: "Audit Logs", href: "/dashboard/admin/audit", icon: FileText },
    { title: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ];

  const hasAdminAccess = adminNav.some(item => 
    !item.permission || permissions.canAccess(item.permission as any)
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Agents Market</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {mainNav.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              if (item.permission && !permissions.canAccess(item.permission as any)) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        ))}

        {hasAdminAccess && (
          <div className="pt-4">
            <div className="border-t border-zinc-200 dark:border-zinc-800 mb-2" />
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Admin
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  adminOpen && "transform rotate-180"
                )}
              />
            </button>
            {adminOpen && (
              <div className="space-y-1 mt-1">
                {adminNav.map((item) => {
                  if (item.permission && !permissions.canAccess(item.permission as any)) {
                    return null;
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
