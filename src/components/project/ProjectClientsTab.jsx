import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, MapPin, ExternalLink, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const clientStatusColors = {
  active: 'bg-emerald-50 text-emerald-600',
  inactive: 'bg-slate-100 text-slate-500',
  prospect: 'bg-amber-50 text-amber-600'
};
const clientStatusLabels = { active: 'Ativo', inactive: 'Inativo', prospect: 'Prospect' };

export default function ProjectClientsTab({ project }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  // Find main client linked to project
  const mainClient = clients.find(c => c.id === project?.client_id);

  if (!mainClient) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="font-heading font-semibold mb-1">Nenhum cliente vinculado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Edite o projeto para vincular um cliente.
        </p>
        <Link to={`/projects/${project?.id}/edit`}>
          <Button size="sm" variant="outline">Editar Projeto</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main client card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-heading font-bold">{mainClient.name}</h2>
              <Badge variant="secondary" className={cn("text-xs", clientStatusColors[mainClient.status])}>
                {clientStatusLabels[mainClient.status] || mainClient.status}
              </Badge>
            </div>

            {mainClient.company && (
              <p className="text-sm text-muted-foreground font-medium">{mainClient.company}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mainClient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${mainClient.email}`} className="text-primary hover:underline truncate">
                    {mainClient.email}
                  </a>
                </div>
              )}
              {mainClient.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${mainClient.phone}`} className="hover:underline">
                    {mainClient.phone}
                  </a>
                </div>
              )}
              {mainClient.address && (
                <div className="flex items-center gap-2 text-sm col-span-full">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{mainClient.address}</span>
                </div>
              )}
              {mainClient.document && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{mainClient.document}</span>
                </div>
              )}
            </div>

            {mainClient.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{mainClient.notes}</p>
              </div>
            )}

            {mainClient.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mainClient.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Link to={`/clients/${mainClient.id}`}>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Perfil Completo
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-xl font-heading font-bold text-primary">1</div>
          <div className="text-xs text-muted-foreground mt-0.5">Projeto(s) vinculado(s)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-heading font-bold">{mainClient.status === 'active' ? '✓' : '—'}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Status</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-heading font-bold">
            {mainClient.tags?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Tags</div>
        </Card>
      </div>
    </div>
  );
}