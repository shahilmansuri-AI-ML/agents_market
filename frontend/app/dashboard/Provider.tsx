"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React, { useState, useEffect } from "react";
import AppSidebar from "./_components/AppSidebar";
import { AppHeader } from "./_components/AppHeader";
import { CreateAgentSection } from "./_components/CreateAgentSection";
import { auth } from "@/lib/auth";
import { tenant } from "@/lib/tenant";
import { permissions } from "@/lib/permissions";

function DashboardProvider({ children }: any) {
  // Initialize role as ADMIN for tenant owners
  const [userRole, setUserRole] = useState("ADMIN");
  const [userEmail, setUserEmail] = useState("");
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const initializeDashboard = async () => {
      // Get user info from auth and tenant
      const email = auth.getUserEmail();
      const isSuperAdmin = localStorage.getItem('super_admin_email') !== null;
      
      // Get current tenant name from localStorage first (set during login or tenant switch)
      let currentTenantName = localStorage.getItem('tenant_name');
      
      // Auto-select first tenant if none is selected
      if (!tenant.getCurrentTenantId() && !isSuperAdmin) {
        try {
          const tenants = await tenant.getMyTenants();
          if (tenants.length > 0) {
            const firstTenant = tenants[0];
            tenant.setCurrentTenant(firstTenant.id, firstTenant.name);
            // Update currentTenantName with the auto-selected tenant
            currentTenantName = firstTenant.name;
          }
        } catch (error) {
          console.error("Failed to auto-select tenant:", error);
        }
      }
      
      // If still not set, try to get from tenant utility (which reads from localStorage)
      if (!currentTenantName) {
        currentTenantName = tenant.getCurrentTenantName();
      }
      
      // For super admin, show the super admin email instead of tenant email
      if (isSuperAdmin) {
        const superAdminEmail = localStorage.getItem('super_admin_email');
        setUserEmail(superAdminEmail || email || "");
        setUserRole("Super Admin");
        // For super admin, show "Super Admin Dashboard" instead of tenant name
        if (!currentTenantName) {
          setTenantName("Super Admin Dashboard");
        } else {
          // When super admin selects a specific tenant, show both context
          setTenantName(`${currentTenantName} (Super Admin)`);
        }
      } else {
        setUserEmail(email || "");
        // Get role from localStorage (set during login)
        const roleName = localStorage.getItem('user_role_name');
        setUserRole(roleName || "User");
        // For regular users, show tenant name from localStorage
        setTenantName(currentTenantName || "My Workspace");
      }
      
      // Fetch and set permissions based on role
      // Check if super admin is viewing as a different role
      const isViewingAsRole = localStorage.getItem('user_role_name') && 
                              localStorage.getItem('user_role_name') !== 'Super Admin';
      
      if (isSuperAdmin && !isViewingAsRole) {
        // Super admin gets all permissions (only when not viewing as another role)
        const adminPermissions = [
          "tenant.manage",
          "users.create",
          "users.read", 
          "users.update",
          "users.delete",
          "roles.assign",
          "roles.manage",
          "audit.view",
          "api_keys.create",
          "api_keys.delete",
          "agents.create",
          "agents.read",
          "agents.update", 
          "agents.delete",
          "tools.manage",
          "workflow.create",
          "workflow.execute",
          "workflow.delete",
          "invitations.send",
          "invitations.manage"
        ];
        
        localStorage.setItem("user_permissions", JSON.stringify(adminPermissions));
        permissions.clearCache();
      } else {
        // Fetch user's actual permissions from their role
        // This includes when Super Admin is viewing as a different role
        try {
          await permissions.fetchUserPermissions();
        } catch (error) {
          console.error("Failed to fetch permissions:", error);
        }
      }
    };
    
    initializeDashboard();
    
    // Listen for storage changes to update tenant name
    const handleStorageChange = () => {
      const newTenantName = localStorage.getItem('tenant_name');
      const isSuperAdmin = localStorage.getItem('super_admin_email') !== null;
      
      if (isSuperAdmin && newTenantName) {
        setTenantName(`${newTenantName} (Super Admin)`);
      } else if (!isSuperAdmin && newTenantName) {
        setTenantName(newTenantName);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar role={userRole} />
      <div className="w-full">
        <AppHeader
          userEmail={userEmail}
          tenantName={tenantName}
        />
        {children}
      </div>
    </SidebarProvider>
  );
}

export default DashboardProvider;