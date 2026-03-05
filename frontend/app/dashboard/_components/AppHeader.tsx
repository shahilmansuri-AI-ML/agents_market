"use client";

import React, { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  User,
  Shield,
  ChevronDown,
  Check,
  Sun,
  Moon,
  CircleUserRound,
  User as UserIcon,
  Settings,
  LogOut,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const mockUser = {
  tenantName: "Media2AI",
  email: "rishi@media2ai.com",
};

export const AppHeader = () => {
  const { tenantName, email } = mockUser;
  const { theme, setTheme } = useTheme();

  const [role, setRole] = useState("User");
  const [permission, setPermission] = useState("View Access Only");

  const permissionOptions = [
    { label: "View Access Only", sub: "Read-only access to available logs." },
    {
      label: "All Tenant Access",
      sub: "Full management of current tenant users.",
    },
    {
      label: "Whole Platform Access",
      sub: "Super-admin root level capabilities.",
    },
  ];

  return (
    <header className="flex h-16 items-center justify-between bg-white dark:bg-zinc-950 px-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-zinc-500" />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
          AGENTIC_PLATFORM
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">

          {/* Role Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 px-3 rounded-full border border-zinc-200 dark:border-zinc-800"
              >
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-medium">{role}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
              {["User", "Tenant Admin", "Platform Owner"].map((item) => (
                <DropdownMenuItem
                  key={item}
                  onClick={() => setRole(item)}
                  className="cursor-pointer"
                >
                  {item}
                  {role === item && (
                    <Check className="w-3.5 h-3.5 ml-auto text-indigo-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-[1.5px] h-6 bg-zinc-300 dark:bg-zinc-700 mx-2 hidden md:block" />

          {/* Permission Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 px-3 rounded-full border border-zinc-200 dark:border-zinc-800"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-medium">{permission}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg">
              {permissionOptions.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => setPermission(item.label)}
                  className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    {permission === item.label && (
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">{item.sub}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-[1.5px] h-6 bg-zinc-300 dark:bg-zinc-700 mx-2 hidden md:block" />

        {/* Action Icons */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="w-[1.5px] h-6 bg-zinc-300 dark:bg-zinc-700 mx-2 hidden md:block" />

          {/* User Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 overflow-hidden border border-zinc-200 dark:border-zinc-700"
              >
                <CircleUserRound className="h-5 w-5 text-zinc-400" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-64 mt-2 p-0 rounded-xl overflow-hidden shadow-2xl"
              align="end"
            >
              <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
                <div className="h-8 w-8 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                  <UserIcon size={14} className="text-indigo-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">{tenantName}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{email}</span>
                </div>
              </div>

              <Separator />

              <div className="p-1.5">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors">
                  <Settings size={12} /> Settings
                </button>
              </div>

              <Separator />

              <div className="p-1.5">
                <Link href="/agents/login" className="w-full">
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors">
                    <LogOut size={12} /> Log out
                  </button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};