import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roleInfo = {
  user: { label: 'Usuário', color: 'bg-slate-100 text-slate-600' },
  admin: { label: 'Administrador', color: 'bg-primary/10 text-primary' },
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });
  const [inviting, setInviting] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-mgmt'],
    queryFn: () => base44.entities.User.list('full_name', 200),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-mgmt'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Função atualizada!');
    },
  });

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) { toast.error('E-mail é obrigatório'); return; }
    setInviting(true);
    await base44.users.inviteUser(inviteForm.email.trim(), inviteForm.role);
    toast.success(`Convite enviado para ${inviteForm.email}!`);
    setInviteOpen(false);
    setInviteForm({ email: '', role: 'user' });
    setInviting(false);
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar usuários..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4" /> Convidar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const ri = roleInfo[user.role] || roleInfo.user;
            const initials = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
            return (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.full_name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />{user.email}
                  </p>
                </div>
                <Badge variant="secondary" className={cn("text-xs shrink-0 hidden sm:inline-flex", ri.color)}>{ri.label}</Badge>
                <Select
                  value={user.role || 'user'}
                  onValueChange={v => updateRoleMutation.mutate({ id: user.id, role: v })}
                  disabled={updateRoleMutation.isPending}
                >
                  <SelectTrigger className="w-36 h-8 text-xs shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button onClick={handleInvite} disabled={inviting} className="gap-1.5">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Enviar Convite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}