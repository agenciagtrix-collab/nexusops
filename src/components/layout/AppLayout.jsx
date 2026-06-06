import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/hooks/useTheme';
import KeyboardShortcutsPanel from '@/components/shortcuts/KeyboardShortcutsPanel';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize theme from user preferences
  useTheme();

  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcuts(true),
  });

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn(
        "md:block",
        mobileOpen ? "block" : "hidden"
      )}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
        />
      </div>

      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        collapsed ? "md:ml-[68px]" : "md:ml-[240px]"
      )}>
        <Outlet context={{ onMenuToggle: () => setMobileOpen(!mobileOpen) }} />
      </main>

      <KeyboardShortcutsPanel open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}