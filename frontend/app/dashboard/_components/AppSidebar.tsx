"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import Link from "next/link";

function AppSidebar({ role } : any) {
  const { open } = useSidebar();
  const [marketplaceOpen, setMarketplaceOpen] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setMarketplaceOpen("");
    }
  }, [open]);

  return (
    // Updated border and background for the main container
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-200 dark:border-zinc-800 transition-colors"
    >
      {/* ---------- HEADER ---------- */}
      {/* Changed bg-white to dark:bg-zinc-950 and text-slate-900 to dark:text-white */}
      <SidebarHeader className="bg-white dark:bg-zinc-950 pt-5 transition-all duration-300">
        <div
          className={`flex items-center ${
            open ? "px-4 gap-4" : "justify-center px-0"
          }`}
        >
          <div className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
            <Image
              src={"/logo.svg"}
              alt="logo"
              width={open ? 42 : 36}
              height={open ? 42 : 36}
              className="object-contain dark:brightness-110"
            />
          </div>

          {open && (
            <h2 className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-zinc-100">
              Agentra
            </h2>
          )}
        </div>
      </SidebarHeader>

      {/* ---------- CONTENT ---------- */}
      {/* Updated bg-white and text colors for dark mode */}
      <SidebarContent className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-300">
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider mb-3">
            Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  className="hover:bg-indigo-50/50 dark:hover:bg-zinc-900 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={2.5}
                    />
                    <span>Dashboard</span>
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
                    <AccordionItem value="marketplace" className="border-none">
                      <AccordionTrigger className="px-2 py-2 hover:no-underline rounded-md transition-all group bg-transparent">
                        <div className="flex items-center">
                          <Store
                            className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
                            strokeWidth={2.5}
                          />
                          <span className="font-bold text-sm ml-2 text-zinc-800 dark:text-zinc-200">
                            AI Marketplace
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="ml-9 mt-0.5 space-y-1">
                        <Link href="/chat-us">
                          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                            <MessageCircleCode
                              className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                              strokeWidth={2}
                            />
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              Chat UI
                            </span>
                          </div>
                        </Link>

                        <Link href="/dashboard/agent-registry">
                          <div className="flex items-center mt-1 gap-2 px-3 py-2 cursor-pointer transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                            <BellElectric
                              className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                              strokeWidth={2}
                            />
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              Agent Registry
                            </span>
                          </div>
                        </Link>

                        {/* Workflow Submenu */}
                        <Accordion type="single" collapsible>
                          <AccordionItem
                            value="no-code-config"
                            className="border-none mt-1"
                          >
                            <AccordionTrigger className="px-3 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md hover:no-underline">
                              <div className="flex items-center gap-2">
                                <PanelBottomDashed
                                  className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                                  strokeWidth={2}
                                />
                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                  Workflow
                                </span>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="ml-6 mt-1 space-y-0">
                              <Link href="/single_agent">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md cursor-pointer transition-all">
                                  <CircleDot
                                    className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                                    strokeWidth={2}
                                  />
                                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-300">
                                    Single Agent
                                  </span>
                                </div>
                              </Link>
                              <Link href="/agent-builder">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md cursor-pointer transition-all">
                                  <GitBranch
                                    className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                                    strokeWidth={2}
                                  />
                                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-300">
                                    Multi Agent
                                  </span>
                                </div>
                              </Link>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Link href="/low-code">
                          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                            <FileTerminal
                              className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
                              strokeWidth={2}
                            />
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                      className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={2.5}
                    />
                    <span>AI Marketplace</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>

              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Profile"
                  className="hover:bg-indigo-50/50 dark:hover:bg-zinc-900 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold"
                >
                  <Link href="/dashboard/agent-registry">
                    <User
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={2.5}
                    />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {(role == "admin" || role == "owner") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Profile"
                    className="hover:bg-indigo-50/50 dark:hover:bg-zinc-900 hover:text-indigo-700 dark:hover:text-indigo-400 font-bold"
                  >
                    <Link href="/tool-creation">
                      <User
                        className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                        strokeWidth={2.5}
                      />
                      <span>Tool Registry</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
