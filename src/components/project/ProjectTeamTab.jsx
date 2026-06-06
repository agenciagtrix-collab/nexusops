import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Crown, User, UserPlus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProjectPermissionsManager from '@/components/permissions/ProjectPermissionsManager';
import { usePermissions } from '@/hooks/usePermissions';

const roleLabels = {
  admin: { label: 'Administrador', class: 'bg-primary/10 text-primary' },
  superadmin: { label: 'Super Admin', class: 'bg-purple-100 text-purple-700' },
  user: { label: 'Membro', class: 'bg-muted text-muted-foreground' },
};

function MemberCard({ user, isOwner, tasks = [] }) {
  const userTasks = tasks.filter(t => t.assignee_ids?.includes(user.id));
  const doneTasks = userTasks.filter(t => t.status === 'done').length;
  const initials = (user.full_name || user.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleInfo = roleLabels[user.role] || roleLabels.user;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{user.full_name || user.email}</span>
            {isOwner && (
              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" /> Responsável
              </span>
            )}
          </div>
          {user.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mail className="w-3 h-3" /> {user.email}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", roleInfo.class)}>
              {roleInfo.label}
            </span>
          </div>
          {userTasks.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex gap-3">
                <span>{userTasks.length} tarefas</span>
                <span className="text-green-600">{doneTasks} concluídas</span>
                <span>{userTasks.length - doneTasks} pendentes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ProjectTeamTab({ project, users = [], tasks = [] }) {
  const { isAdmin } = usePermissions();
  const [showPermissions, setShowPermissions] = useState(false);
  const owner = users.find(u => u.id === project.owner_id);
  const teamMembers = (project.team_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);

  const allMembers = [];
  if (owner && !allMembers.find(m => m.id === owner.id)) allMembers.push(owner);
  teamMembers.forEach(m => { if (!allMembers.find(a => a.id === m.id)) allMembers.push(m); });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-heading font-semibold">Equipe do Projeto</h3>
          <p className="text-sm text-muted-foreground">{allMembers.length} membros</p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowPermissions(!showPermissions)}
          >
            <Shield className="w-3.5 h-3.5" />
            {showPermissions ? 'Ver Membros' : 'Permissões'}
          </Button>
        )}
      </div>

      {showPermissions && isAdmin ? (
        <ProjectPermissionsManager
          projectId={project.id}
          users={allMembers.length > 0 ? allMembers : users}
          isAdmin={isAdmin}
        />
      ) : allMembers.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum membro adicionado ao projeto.</p>
          <p className="text-xs text-muted-foreground mt-1">Edite o projeto para adicionar membros da equipe.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMembers.map(member => (
            <MemberCard
              key={member.id}
              user={member}
              isOwner={member.id === project.owner_id}
              tasks={tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}