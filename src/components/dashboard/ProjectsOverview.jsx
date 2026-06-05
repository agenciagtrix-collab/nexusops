import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
  critical: 'Crítica',
};

export default function ProjectsOverview({ projects = [] }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-heading">Projetos Ativos</CardTitle>
        <Link to="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum projeto ativo
          </p>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="block group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[project.status] || ''}`}>
                    {statusLabels[project.status] || project.status}
                  </Badge>
                </div>
                <Progress value={project.progress || 0} className="h-1.5" />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {priorityLabels[project.priority] || 'Média'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {project.progress || 0}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}