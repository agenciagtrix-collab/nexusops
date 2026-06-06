import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserManagement from '@/components/admin/UserManagement';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Shield, Users, FolderKanban, Building2, Activity,
  BarChart2, Lock, CheckCircle2, AlertTriangle, Clock, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { key: 'users', label: 'Usuários', icon: Users },
  { key: 'projects', label: 'Projetos', icon: FolderKanban },
  { key: 'clients', label: 'Clientes', icon: Building2 },
  { key: 'activity', label: 'Atividade', icon: Activity },
];

export default function SuperAdminPanel() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: users = [] } = useQuery({
    queryKey: ['users-mgmt'],
    queryFn: () => base44.entities.User.list('full_name', 200),
    enabled: isAdmin,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
    enabled: isAdmin,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 200),
    enabled: isAdmin,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks-admin'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
    enabled: isAdmin,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['all-activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 100),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <>
        <TopBar onMenuToggle={onMenuToggle} title="Painel Administrativo" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-10 text-center max-w-sm">
            <Lock className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-heading font-semibold mb-2">Acesso Negado</h3>
            <p className="text-sm text-muted-foreground mb-4">Apenas administradores podem acessar este painel.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Início</Button>
          </Card>
        </div>
      </>
    );
  }

  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
  const superAdmins = users.filter(u => u.role === 'super_admin');
  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  });

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Painel Administrativo"
        actions={
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Usuários', value: users.length, icon: Users, color: 'bg-primary/10 text-primary' },
                  { label: 'Projetos Ativos', value: activeProjects.length, icon: FolderKanban, color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Tarefas Concluídas', value: completedTasks.length, icon: CheckCircle2, color: 'bg-blue-100 text-blue-700' },
                  { label: 'Tarefas Atrasadas', value: overdueTasks.length, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-3xl font-heading font-bold">{stat.value}</div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Distribuição de Funções</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Super Administradores', count: superAdmins.length, color: 'bg-purple-200', textColor: 'text-purple-700' },
                      { label: 'Administradores', count: adminUsers.length - superAdmins.length, color: 'bg-primary/20', textColor: 'text-primary' },
                      { label: 'Usuários', count: users.length - adminUsers.length, color: 'bg-slate-200', textColor: 'text-slate-600' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className={cn("font-semibold", item.textColor)}>{item.count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", item.color)}
                              style={{ width: users.length ? `${(item.count / users.length) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Resumo da Plataforma</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Total de Projetos', value: projects.length, icon: FolderKanban },
                      { label: 'Total de Clientes', value: clients.length, icon: Building2 },
                      { label: 'Total de Tarefas', value: tasks.length, icon: CheckCircle2 },
                      { label: 'Tarefas em Andamento', value: tasks.filter(t => t.status === 'in_progress').length, icon: Clock },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {item.label}</span>
                          <span className="font-semibold">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4">Gerenciamento de Usuários</h3>
              <UserManagement />
            </Card>
          )}

          {/* Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <Card className="p-12 text-center"><p className="text-sm text-muted-foreground">Nenhum projeto</p></Card>
              ) : (
                projects.map(p => (
                  <Card key={p.id} className="p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        {p.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
                      </div>
                      <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-3">
              {clients.length === 0 ? (
                <Card className="p-12 text-center"><p className="text-sm text-muted-foreground">Nenhum cliente</p></Card>
              ) : (
                clients.map(c => (
                  <Card key={c.id} className="p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                      </div>
                      <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Activity */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <Card className="p-12 text-center"><p className="text-sm text-muted-foreground">Nenhuma atividade</p></Card>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-2 pb-2">
                    {activities.map(act => (
                      <div key={act.id} className="flex items-start gap-4 pl-10 relative">
                        <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
                        <Card className="flex-1 p-3">
                          <p className="text-sm">{act.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(act.created_date).toLocaleString('pt-BR')}</p>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}