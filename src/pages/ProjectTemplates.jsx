import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, LayoutTemplate, Trash2, Copy, Edit, CheckSquare, Layers, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const CATEGORIES = [
  { key: 'development', label: 'Desenvolvimento', color: '#6366f1' },
  { key: 'marketing', label: 'Marketing', color: '#f59e0b' },
  { key: 'design', label: 'Design', color: '#8b5cf6' },
  { key: 'hr', label: 'RH', color: '#22c55e' },
  { key: 'sales', label: 'Vendas', color: '#3b82f6' },
  { key: 'operations', label: 'Operações', color: '#ef4444' },
  { key: 'other', label: 'Outro', color: '#94a3b8' },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-dev', name: 'Desenvolvimento de Software', category: 'development', color: '#6366f1',
    description: 'Template padrão para projetos de desenvolvimento ágil',
    task_groups: [{ name: 'Backlog', order: 0 }, { name: 'Sprint Atual', order: 1 }, { name: 'Em Revisão', order: 2 }, { name: 'Concluído', order: 3 }],
    tasks: [
      { title: 'Definição de requisitos', group_name: 'Backlog', priority: 'high', estimated_hours: 8 },
      { title: 'Arquitetura do sistema', group_name: 'Backlog', priority: 'high', estimated_hours: 16 },
      { title: 'Setup do ambiente', group_name: 'Sprint Atual', priority: 'medium', estimated_hours: 4 },
      { title: 'Testes unitários', group_name: 'Em Revisão', priority: 'medium', estimated_hours: 8 },
      { title: 'Deploy em produção', group_name: 'Concluído', priority: 'critical', estimated_hours: 4 },
    ],
    custom_statuses: [
      { name: 'Backlog', color: '#94a3b8', order: 0 },
      { name: 'Em Sprint', color: '#6366f1', order: 1 },
      { name: 'Em Revisão', color: '#f59e0b', order: 2 },
      { name: 'Concluído', color: '#22c55e', order: 3 },
    ],
    uses: 0,
  },
  {
    id: 'tpl-mkt', name: 'Campanha de Marketing', category: 'marketing', color: '#f59e0b',
    description: 'Template para gestão de campanhas e conteúdo',
    task_groups: [{ name: 'Planejamento', order: 0 }, { name: 'Criação', order: 1 }, { name: 'Revisão', order: 2 }, { name: 'Publicado', order: 3 }],
    tasks: [
      { title: 'Briefing da campanha', group_name: 'Planejamento', priority: 'high', estimated_hours: 4 },
      { title: 'Definição de personas', group_name: 'Planejamento', priority: 'medium', estimated_hours: 6 },
      { title: 'Criação de copies', group_name: 'Criação', priority: 'high', estimated_hours: 8 },
      { title: 'Design dos materiais', group_name: 'Criação', priority: 'high', estimated_hours: 16 },
      { title: 'Revisão interna', group_name: 'Revisão', priority: 'medium', estimated_hours: 4 },
      { title: 'Aprovação do cliente', group_name: 'Revisão', priority: 'critical', estimated_hours: 2 },
    ],
    custom_statuses: [],
    uses: 0,
  },
  {
    id: 'tpl-design', name: 'Projeto de Design UI/UX', category: 'design', color: '#8b5cf6',
    description: 'Fluxo completo de design para produtos digitais',
    task_groups: [{ name: 'Pesquisa', order: 0 }, { name: 'Wireframes', order: 1 }, { name: 'Prototipação', order: 2 }, { name: 'Entrega', order: 3 }],
    tasks: [
      { title: 'Pesquisa com usuários', group_name: 'Pesquisa', priority: 'high', estimated_hours: 12 },
      { title: 'Análise de concorrentes', group_name: 'Pesquisa', priority: 'medium', estimated_hours: 8 },
      { title: 'Wireframes das telas principais', group_name: 'Wireframes', priority: 'high', estimated_hours: 16 },
      { title: 'Protótipo interativo', group_name: 'Prototipação', priority: 'high', estimated_hours: 20 },
      { title: 'Design System', group_name: 'Entrega', priority: 'high', estimated_hours: 24 },
      { title: 'Handoff para dev', group_name: 'Entrega', priority: 'medium', estimated_hours: 4 },
    ],
    custom_statuses: [],
    uses: 0,
  },
  {
    id: 'tpl-onboard', name: 'Onboarding de Cliente', category: 'operations', color: '#22c55e',
    description: 'Processo de boas-vindas e integração de novos clientes',
    task_groups: [{ name: 'Contrato', order: 0 }, { name: 'Setup', order: 1 }, { name: 'Treinamento', order: 2 }, { name: 'Go-live', order: 3 }],
    tasks: [
      { title: 'Assinatura do contrato', group_name: 'Contrato', priority: 'critical', estimated_hours: 1 },
      { title: 'Coleta de dados do cliente', group_name: 'Setup', priority: 'high', estimated_hours: 2 },
      { title: 'Configuração do ambiente', group_name: 'Setup', priority: 'high', estimated_hours: 8 },
      { title: 'Treinamento da equipe', group_name: 'Treinamento', priority: 'medium', estimated_hours: 4 },
      { title: 'Validação final', group_name: 'Go-live', priority: 'high', estimated_hours: 2 },
    ],
    custom_statuses: [],
    uses: 0,
  },
];

const emptyForm = { name: '', description: '', category: 'other', color: '#6366f1' };

export default function ProjectTemplates() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, canCreate } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCat, setSelectedCat] = useState('all');
  const [useTemplateId, setUseTemplateId] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [useDialogOpen, setUseDialogOpen] = useState(false);

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date', 50),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.ProjectTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); closeDialog(); toast.success('Template criado!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.ProjectTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template excluído'); },
  });

  const createProjectMut = useMutation({
    mutationFn: async ({ template, name }) => {
      const project = await base44.entities.Project.create({
        name,
        color: template.color || '#6366f1',
        custom_statuses: template.custom_statuses || [],
        status: 'not_started',
      });
      // Create task groups
      const groupMap = {};
      for (const g of (template.task_groups || [])) {
        const group = await base44.entities.TaskGroup.create({ name: g.name, project_id: project.id, order: g.order });
        groupMap[g.name] = group.id;
      }
      // Create tasks
      for (const t of (template.tasks || [])) {
        await base44.entities.Task.create({
          title: t.title,
          description: t.description || '',
          project_id: project.id,
          group_id: groupMap[t.group_name] || '',
          priority: t.priority || 'medium',
          estimated_hours: t.estimated_hours,
          status: 'todo',
        });
      }
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setUseDialogOpen(false);
      setProjectName('');
      setUseTemplateId(null);
      toast.success('Projeto criado a partir do template!');
      navigate(`/projects/${project.id}`);
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleUseTemplate = (template) => {
    setUseTemplateId(template.id || template.id);
    setProjectName(template.name);
    setUseDialogOpen(true);
  };

  const allTemplates = [
    ...DEFAULT_TEMPLATES,
    ...customTemplates,
  ];

  const filtered = selectedCat === 'all' ? allTemplates : allTemplates.filter(t => t.category === selectedCat);
  const templateToUse = allTemplates.find(t => t.id === useTemplateId);

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Templates de Projetos"
        actions={
          isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Template</span>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
          {/* Category filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCat('all')}
              className={cn("text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors",
                selectedCat === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              )}>
              Todos ({allTemplates.length})
            </button>
            {CATEGORIES.map(c => {
              const count = allTemplates.filter(t => t.category === c.key).length;
              if (!count) return null;
              return (
                <button key={c.key}
                  onClick={() => setSelectedCat(c.key)}
                  className={cn("text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors",
                    selectedCat === c.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  )}>
                  {c.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(template => {
              const cat = CATEGORIES.find(c => c.key === template.category);
              const isDefault = template.id?.startsWith('tpl-');
              return (
                <Card key={template.id} className="p-5 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: template.color || '#6366f1' }} />
                      <h3 className="font-heading font-semibold text-sm truncate">{template.name}</h3>
                    </div>
                    {isDefault && <Badge variant="secondary" className="text-[10px] shrink-0">Padrão</Badge>}
                  </div>

                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {template.task_groups?.length || 0} grupos
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      {template.tasks?.length || 0} tarefas
                    </span>
                    {cat && <Badge variant="outline" className="text-[10px]" style={{ borderColor: cat.color, color: cat.color }}>{cat.label}</Badge>}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleUseTemplate(template)}>
                      <FolderKanban className="w-3.5 h-3.5" />
                      Usar template
                    </Button>
                    {!isDefault && isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => deleteMut.mutate(template.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Use Template Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar projeto a partir do template</DialogTitle>
          </DialogHeader>
          {templateToUse && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{templateToUse.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {templateToUse.task_groups?.length || 0} grupos · {templateToUse.tasks?.length || 0} tarefas
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Nome do projeto</Label>
                <Input placeholder="Nome do novo projeto" value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && projectName.trim() && createProjectMut.mutate({ template: templateToUse, name: projectName })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setUseDialogOpen(false)}>Cancelar</Button>
                <Button className="flex-1 gap-1.5"
                  disabled={!projectName.trim() || createProjectMut.isPending}
                  onClick={() => createProjectMut.mutate({ template: templateToUse, name: projectName })}>
                  {createProjectMut.isPending ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Nome do template" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva o template..." rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <Input type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-9 px-2 cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>Cancelar</Button>
              <Button className="flex-1" onClick={() => createMut.mutate(form)} disabled={!form.name.trim()}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}