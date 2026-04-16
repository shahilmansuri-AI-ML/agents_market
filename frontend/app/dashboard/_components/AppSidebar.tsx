"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { permissions } from "@/lib/permissions";

import {
  LayoutDashboard,
  User,
  Store,
  BellElectric,
  FileTerminal,
  PanelBottomDashed,
  CircleDot,
  GitBranch,
  MessageCircleCode,
  Users,
  Shield,
  Mail,
  Key,
  FileText,
  Settings,
  ChevronDown,
  Crown,
  Building2,
  Activity,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { title } from "process";

const adminNav = [
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: "users.read",
  },
  {
    title: "Roles",
    href: "/dashboard/admin/roles",
    icon: Shield,
    permission: "roles.manage",
  },
  {
    title: "Invitations",
    href: "/dashboard/admin/invitations",
    icon: Mail,
    permission: "invitations.manage",
  },
  {
    title: "API Keys",
    href: "/dashboard/admin/api-keys",
    icon: Key,
    permission: "api_keys.create",
  },
  {
    title: "Audit Logs",
    href: "/dashboard/admin/audit",
    icon: FileText,
    permission: "audit.view",
  },
  {
    title: "Usage & Quotas",
    href: "/dashboard/usage",
    icon: Activity,
    permission: "api_keys.create",
  },
  {
    title: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
    permission: "tenant.manage",
  },
  {
    title : "Tool Registry",
    href : "/dashboard/admin/tool-registry",
    icon : Store,
    permission : "tools.manage",
  },
  {
    title : "LLM Management",
    href : "/dashboard/admin/llm-registry",
    icon : Crown,
    permission : "llms.manage",
  }
];

function AppSidebar({ role }: any) {
  const { open } = useSidebar();
  const [marketplaceOpen, setMarketplaceOpen] = useState<string>("");
  const [adminOpen, setAdminOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);

  // Hydration fix: state to track if we are on the client
  const [mounted, setMounted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for super admin only on client side
    const superAdminEmail = localStorage.getItem("super_admin_email");
    if (superAdminEmail !== null) {
      setIsSuperAdmin(true);
    }
  }, []);

  // Check if super admin is viewing as a different role
  const isViewingAsRole = typeof window !== 'undefined' &&
    isSuperAdmin &&
    localStorage.getItem('user_role_name') &&
    localStorage.getItem('user_role_name') !== 'Super Admin';

  // Show platform admin section only if super admin AND not viewing as another role
  const showPlatformAdmin = isSuperAdmin && !isViewingAsRole;

  useEffect(() => {
    if (!open) setMarketplaceOpen("");
  }, [open]);

  useEffect(() => {
    if (mounted) {
      console.log("AppSidebar Debug:", {
        role,
        userPermissions: permissions.getUserPermissions(),
        localStoragePermissions: localStorage.getItem("user_permissions"),
        isAdmin: permissions.isAdmin(),
        isOwner: permissions.isOwner(),
        isSuperAdmin: permissions.isSuperAdmin(),
      });
    }
  }, [mounted, role]);

  const canSeeAdminItem = (permission: string) => {
    // If user is admin/owner by role, show all admin items
    // This handles the case where permissions are still loading
    if (permissions.isAdmin() || permissions.isOwner()) {
      return true;
    }
    return permissions.canAccess(permission as any);
  };

  // Only calculate admin access if mounted to avoid server/client mismatch
  const hasAdminAccess =
    mounted &&
    (permissions.isAdmin() ||
      adminNav.some((item) => permissions.canAccess(item.permission as any)));

  useEffect(() => {
    if (mounted) {
      console.log("🔍 hasAdminAccess calculation:", {
        mounted,
        isAdmin: permissions.isAdmin(),
        hasAnyAdminPermission: adminNav.some((item) => permissions.canAccess(item.permission as any)),
        hasAdminAccess,
        userPermissionsCount: permissions.getUserPermissions().length
      });
    }
  }, [mounted, role, hasAdminAccess]);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap");

        :root {
          --bg: #080b0f;
          --surface: #0d1117;
          --surface-2: #161b22;
          --border: rgba(255, 255, 255, 0.06);
          --border-hover: rgba(255, 255, 255, 0.12);
          --accent: #3b82f6;
          --accent-hover: #2563eb;
          --text-primary: #f0f6fc;
          --text-secondary: #7d8590;
        }

        body {
          background: var(--bg);
          font-family: "Syne", sans-serif;
        }

        .header-theme {
          background: var(--surface);
          border-color: var(--border);
        }
      `}</style>

      <Sidebar
        collapsible="icon"
        className="sidebar-theme border-r border-[var(--border)]"
      >
        <SidebarHeader className="bg-[var(--surface)] pt-5">
          <div
            className={`flex items-center ${open ? "px-4 gap-4" : "justify-center px-0"}`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="logo"
                width={open ? 42 : 36}
                height={open ? 42 : 36}
                className="w-5 h-5"
              />
            </div>
            {open && (
              <h2 className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-zinc-100">
                Media2AI
              </h2>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-[var(--surface)] text-[var(--text-primary)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider mb-3">
              Menu
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="font-normal text-sm text-zinc-800 dark:text-zinc-200">
                        Dashboard
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* AI Marketplace */}
                <SidebarMenuItem>
                  {open ? (
                    <Accordion
                      type="single"
                      collapsible
                      value={marketplaceOpen}
                      onValueChange={setMarketplaceOpen}
                    >
                      <AccordionItem
                        value="marketplace"
                        className="border-none"
                      >
                        <AccordionTrigger className="px-2 py-2 hover:no-underline rounded-md transition-all group bg-transparent hover:bg-[var(--surface-2)]">
                          <div className="flex items-center">
                            <Store className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="font-normal text-sm ml-2 text-[var(--text-primary)]">
                              AI Marketplace
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="ml-9 mt-0.5 space-y-1">
                          <Link href="/chat-us">
                            <div className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all bg-[var(--surface-2)] hover:bg-[var(--border-hover)] rounded-md">
                              <MessageCircleCode
                                className="w-4 h-4 text-[var(--text-secondary)]"
                                strokeWidth={2}
                              />
                              <span className="text-sm font-normal text-[var(--text-primary)]">
                                Chat UI
                              </span>
                            </div>
                          </Link>

                          <Link href="/dashboard/agent-registry">
                            <div className="flex items-center mt-1 gap-2 px-3 py-2 cursor-pointer transition-all bg-[var(--surface-2)] hover:bg-[var(--border-hover)] rounded-md">
                              <BellElectric
                                className="w-4 h-4 text-[var(--text-secondary)]"
                                strokeWidth={2}
                              />
                              <span className="text-sm font-normal text-[var(--text-primary)]">
                                Agent Registry
                              </span>
                            </div>
                          </Link>

                          <Accordion type="single" collapsible>
                            <AccordionItem
                              value="no-code-config"
                              className="border-none mt-1"
                            >
                              <AccordionTrigger className="px-3 py-2 bg-[var(--surface-2)] hover:bg-[var(--border-hover)] rounded-md hover:no-underline">
                                <div className="flex items-center gap-2">
                                  <PanelBottomDashed
                                    className="w-4 h-4 text-[var(--text-secondary)]"
                                    strokeWidth={2}
                                  />
                                  <span className="text-sm font-normal text-[var(--text-primary)]">
                                    Workflow
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="ml-6 mt-1 space-y-0">
                                <Link href="/single_agent">
                                  <div
                                    className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] rounded-md cursor-pointer transition-all"
                                    onClick={() =>
                                      localStorage.removeItem("agentForm")
                                    }
                                  >
                                    <CircleDot
                                      className="w-4 h-4 text-[var(--text-secondary)]"
                                      strokeWidth={2}
                                    />
                                    <span className="text-sm font-normal text-[var(--text-primary)]">
                                      Single Agent
                                    </span>
                                  </div>
                                </Link>
                                <Link href="/agent-builder">
                                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] rounded-md cursor-pointer transition-all">
                                    <GitBranch
                                      className="w-4 h-4 text-[var(--text-secondary)]"
                                      strokeWidth={2}
                                    />
                                    <span className="text-sm font-normal text-[var(--text-primary)]">
                                      Multi Agent
                                    </span>
                                  </div>
                                </Link>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          <Link href="/low-code">
                            <div className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all bg-[var(--surface-2)] hover:bg-[var(--border-hover)] rounded-md">
                              <FileTerminal
                                className="w-4 h-4 text-[var(--text-secondary)]"
                                strokeWidth={2}
                              />
                              <span className="text-sm font-normal text-[var(--text-primary)]">
                                AI Agent Studio
                              </span>
                            </div>
                          </Link>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <SidebarMenuButton
                      tooltip="AI Marketplace"
                      className="hover:bg-indigo-50/50 dark:hover:bg-zinc-900 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold"
                    >
                      <Store
                        className="w-4 h-4 text-[var(--text-secondary)]"
                        strokeWidth={2.5}
                      />
                      <span>AI Marketplace</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>

                {/* Admin Section - Only shows if mounted to avoid hydration errors */}
                {mounted && hasAdminAccess && (
                  <>
                    {open && (
                      <>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 my-3" />
                        <div className="hover:no-underline rounded-md transition-all group bg-transparent hover:bg-[var(--surface-2)]">
                          <button
                            onClick={() => setAdminOpen(!adminOpen)}
                            // Added transition and hover effects to the Admin header
                            className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors duration-200"
                          >
                            Admin
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-300 ${adminOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Yaha layout shift ko rokne ke liye div wrapper use kiya hai */}
                    <div
                      className={`space-y-1 transition-all duration-300 ${open && !adminOpen ? "h-0 overflow-hidden" : "h-auto"}`}
                    >
                      {(!open || adminOpen) &&
                        adminNav.map((item) => {
                          if (!canSeeAdminItem(item.permission)) return null;
                          const Icon = item.icon;
                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                // Yaha Marketplace wala animation aur style add kiya hai
                                className="px-3 py-2 rounded-md transition-all duration-200 group bg-transparent hover:bg-[var(--surface-2)] active:scale-[0.98]"
                              >
                                <Link
                                  href={item.href}
                                  className="flex items-center w-full"
                                >
                                  <Icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                                  <span className="ml-2 text-sm font-normal text-[var(--text-primary)]">
                                    {item.title}
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                    </div>
                  </>
                )}

                {/* Platform Administration Section - Super Admin Only */}
                {mounted && showPlatformAdmin && (
                  <div className={open ? "mt-2" : "mt-0"}>
                    {open && (
                      <>
                        {/* Modern subtle separator - only visible when open */}
                        <div className="mx-3 border-t border-zinc-200 dark:border-zinc-800 my-3 opacity-50" />

                        <button
                          onClick={() => setPlatformOpen(!platformOpen)}
                          className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                            <span>Platform Admin</span>
                          </div>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-300 ${platformOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </>
                    )}

                    {/* Items Wrapper: Padding open state ke hisab se dynamic rakhi hai */}
                    {(!open || platformOpen) && (
                      <div className={`space-y-1 ${open ? "px-2" : "px-0"}`}>
                        {/* <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            tooltip="Switch Tenant"
                            // Padding aur alignment ko sidebar state ke hisab se adjust kiya
                            className={`w-full rounded-md transition-all duration-200 group hover:bg-[var(--surface-2)] active:scale-[0.98] ${
                              open ? "px-2 py-2" : "flex justify-center p-0"
                            }`}
                          >
                            <Link
                              href="/tenant-select"
                              className={`flex items-center ${!open ? "justify-center w-full" : ""}`}
                            >
                              <Building2 className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors" />
                              {open && (
                                <span className="ml-2 text-sm font-normal text-[var(--text-primary)]">
                                  Switch Tenant
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem> */}

                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            tooltip="All Tenants"
                            className={`w-full rounded-md transition-all duration-200 group hover:bg-[var(--surface-2)] active:scale-[0.98] ${
                              open ? "px-2 py-2" : "flex justify-center p-0"
                            }`}
                          >
                            <Link
                              href="/dashboard/admin/all-tenants"
                              className={`flex items-center ${!open ? "justify-center w-full" : ""}`}
                            >
                              <Store className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors" />
                              {open && (
                                <span className="ml-2 text-sm font-normal text-[var(--text-primary)]">
                                  All Tenants
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </div>
                    )}
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}

export default AppSidebar;
