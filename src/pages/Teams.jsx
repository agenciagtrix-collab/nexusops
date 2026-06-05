import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, CheckSquare, AlertTriangle, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const roleLabels = { super_admin: 'Super Admin', admin: 'Administrador', user: 'Usuário' };
const roleColors = {
  super_admin: 'bg-purple-50 text-purple-600',
  admin: 'bg-primary/10 text-primary',
  user: 'bg-slate-100 text-slate-600',
};

export default function Teams() {
  const { onMenuToggle } = useOutletContext();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'user' });
      toast.success('Convite enviado com sucesso!');
    },
    onError: () => toast.error('Erro ao enviar convite'),
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) { toast.error('Informe o e-mail'); return; }
    inviteMutation.mutate(inviteForm);
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getUserStats = (userId) => {
    const userTasks = tasks.filter(t => t.assignee_ids?.includes(userId));
    const done = userTasks.filter(t => t.status === 'done').length;
    const overdue = userTasks.filter(t =>
      t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
    ).length;
    return { total: userTasks.length, done, overdue, pending: userTasks.length - done };
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Equipes"
        actions={
          isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Convidar</span>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total de membros</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-primary">
                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Administradores</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-emerald-600">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Tarefas concluídas</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-amber-600">
                {tasks.filter(t =>
                  t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
                ).length}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Tarefas atrasadas</div>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar membros..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {/* Members grid */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-heading font-semibold mb-1">Nenhum membro encontrado</h3>
              <p className="text-sm text-muted-foreground">Convide membros para a equipe</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(user => {
                const stats = getUserStats(user.id);
                return (
                  <Card key={user.id} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-sm truncate">{user.full_name || 'Sem nome'}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="secondary" className={cn("text-[10px]", roleColors[user.role] || roleColors.user)}>
                            {roleLabels[user.role] || 'Usuário'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Workload */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                      <div className="text-center">
                        <div className="text-base font-heading font-bold">{stats.total}</div>
                        <div className="text-[10px] text-muted-foreground">Tarefas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-heading font-bold text-emerald-600">{stats.done}</div>
                        <div className="text-[10px] text-muted-foreground">Concluídas</div>
                      </div>
                      <div className="text-center">
                        <div className={cn("text-base font-heading font-bold", stats.overdue > 0 ? "text-red-500" : "text-slate-400")}>
                          {stats.overdue}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Atrasadas</div>
                      </div>
                    </div>

                    {/* Workload bar */}
                    {stats.total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{Math.round((stats.done / stats.total) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Convidar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={inviteMutation.isPending} className="gap-1.5">
                <UserPlus className="w-4 h-4" />
                {inviteMutation.isPending ? 'Enviando...' : 'Convidar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}