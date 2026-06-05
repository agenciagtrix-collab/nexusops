import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from '@/components/layout/NotificationPanel';

export default function TopBar({ onMenuToggle, title, actions }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {title && (
          <h1 className="text-lg font-heading font-semibold truncate">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <NotificationPanel />
        <Avatar className="w-8 h-8 cursor-pointer" onClick={() => navigate('/profile')}>
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}