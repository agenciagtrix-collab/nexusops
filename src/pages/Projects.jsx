import { usePermissions } from '@/hooks/usePermissions';
import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, FolderKanban, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Andamento',
  on_hold: 'Em Espera',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-primary/10 text-primary',
  on_hold: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-red-50 text-red-600',
};

const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' };

export default function Projects() {
  const { onMenuToggle } = useOutletContext();
  const { canCreate } = usePermissions();
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Projetos"
        actions={
          canCreate && (
            <Link to="/projects/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Projeto</span>
              </Button>
            </Link>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-2 bg-muted rounded w-full" />
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-heading font-semibold mb-1">Nenhum projeto encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? 'Tente uma busca diferente' : 'Crie seu primeiro projeto para começar'}
              </p>
              {!search && (
                <Link to="/projects/new">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Criar Projeto
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                  <Card className="p-5 hover:shadow-md transition-all hover:border-primary/20 cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <h3 className="font-heading font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      {project.code && (
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{project.code}</span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                    )}

                    <Progress value={project.progress || 0} className="h-1.5 mb-3" />

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={cn("text-xs", statusColors[project.status])}>
                        {statusLabels[project.status] || 'Não Iniciado'}
                      </Badge>
                      {project.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(project.due_date), "dd MMM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}