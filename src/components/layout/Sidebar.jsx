import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalSearch from '@/components/layout/GlobalSearch';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  LogOut,
  FileText,
  Sliders,
  Workflow,
  UserCircle,
  ShieldCheck,
  Zap,
  LayoutTemplate
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projetos', path: '/projects' },
  { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { icon: CheckSquare, label: 'Minhas Tarefas', path: '/my-tasks' },
  { icon: Users, label: 'Equipes', path: '/teams' },
  { icon: Building2, label: 'Clientes', path: '/clients' },
  { icon: FileText, label: 'Documentos', path: '/documents' },
  { icon: Workflow, label: 'Processos', path: '/processes' },
  { icon: Zap, label: 'Automações', path: '/automations' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Sliders, label: 'Campos', path: '/custom-fields' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
      "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-base tracking-tight whitespace-nowrap">
              ProjetiX
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      {!collapsed ? (
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Buscar...</span>
            <span className="ml-auto text-xs bg-sidebar-accent px-1.5 py-0.5 rounded">⌘K</span>
          </button>
        </div>
      ) : (
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Admin Panel Link */}
      {isAdmin && (
        <div className="px-3 pb-1">
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === '/admin'
                ? "bg-purple-600 text-white shadow-sm"
                : "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            )}
            title={collapsed ? 'Painel Admin' : undefined}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Painel Admin</span>}
          </Link>
        </div>
      )}

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            location.pathname === '/profile'
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
          title={collapsed ? 'Meu Perfil' : undefined}
        >
          <UserCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Meu Perfil</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}