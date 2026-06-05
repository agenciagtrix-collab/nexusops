import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Mail } from 'lucide-react';

const roleLabels = { super_admin: 'Super Admin', admin: 'Administrador', user: 'Usuário' };
const roleColors = { super_admin: 'bg-purple-50 text-purple-600', admin: 'bg-primary/10 text-primary', user: 'bg-slate-100 text-slate-600' };

export default function Teams() {
  const { onMenuToggle } = useOutletContext();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Equipes" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          {users.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-heading font-semibold mb-1">Nenhum membro</h3>
              <p className="text-sm text-muted-foreground">Convide membros para a equipe</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <Card key={user.id} className="p-5 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
                        <Badge variant="secondary" className={`text-[10px] ${roleColors[user.role] || roleColors.user}`}>
                          {roleLabels[user.role] || 'Usuário'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}