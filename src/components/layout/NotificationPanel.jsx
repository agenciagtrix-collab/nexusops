import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, X, FolderKanban, CheckSquare, MessageSquare, Users, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const typeConfig = {
  task_assigned: { icon: CheckSquare, color: 'text-primary', bg: 'bg-primary/10' },
  task_due: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  comment_added: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  status_changed: { icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  project_created: { icon: FolderKanban, color: 'text-violet-600', bg: 'bg-violet-50' },
  member_added: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  task_completed: { icon: CheckCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mention: { icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-50' },
};

export default function NotificationPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user ? base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 30) : [],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (notif) => {
    if (!notif.read) markRead.mutate(notif.id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Notificações</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground"
                    onClick={() => markAllRead.mutate()}
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const cfg = typeConfig[notif.type] || typeConfig.task_assigned;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                        !notif.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm leading-snug", !notif.read ? "font-semibold" : "font-medium text-muted-foreground")}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}