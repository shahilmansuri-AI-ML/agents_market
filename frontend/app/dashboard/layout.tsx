import React from 'react'
import DashboardProvider from './Provider'
import { ThemeProvider } from '../context/theme-provider'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is recommended by next-themes to prevent 
    // flickering during the initial page load
    <div suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <DashboardProvider>
          {children}
        </DashboardProvider>
        
      </ThemeProvider>
    </div>
  );
}

export default DashboardLayout