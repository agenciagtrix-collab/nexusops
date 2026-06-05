import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus, GitBranch, Play, Trash2, Edit2, ChevronRight,
  CheckCircle2, Circle, ArrowRight, Workflow, Copy, MoreVertical, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const categoryColors = {
  comercial: 'bg-blue-100 text-blue-700',
  qualidade: 'bg-emerald-100 text-emerald-700',
  desenvolvimento: 'bg-violet-100 text-violet-700',
  operacional: 'bg-amber-100 text-amber-700',
  rh: 'bg-pink-100 text-pink-700',
  financeiro: 'bg-orange-100 text-orange-700',
};

function ProcessCard({ process, onEdit, onDuplicate, onDelete, onToggle }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            process.active ? "bg-primary/10" : "bg-muted"
          )}>
            <Workflow className={cn("w-5 h-5", process.active ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{process.name}</h3>
              {process.category && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                  categoryColors[process.category] || 'bg-muted text-muted-foreground')}>
                  {process.category}
                </span>
              )}
              {!process.active && (
                <Badge variant="secondary" className="text-[10px]">Inativo</Badge>
              )}
            </div>
            {process.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{process.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(process)}>
              <Edit2 className="w-4 h-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(process)}>
              <Copy className="w-4 h-4 mr-2" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle(process)}>
              {process.active ? <Circle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {process.active ? 'Desativar' : 'Ativar'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(process.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Steps flow */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3">
        {(process.steps || []).map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {step.order}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{step.name}</span>
            </div>
            {i < (process.steps?.length || 0) - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {process.steps?.length || 0} etapas
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" /> {process.runs || 0} execuções
          </span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => toast.info('Em breve: iniciar processo a partir de um projeto')}>
          <Play className="w-3 h-3" /> Usar
        </Button>
      </div>
    </Card>
  );
}

function ProcessForm({ initial, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [steps, setSteps] = useState(
    initial?.steps?.length
      ? initial.steps
      : [{ id: Date.now().toString(), name: '', description: '', order: 1 }]
  );

  const addStep = () => {
    setSteps(prev => [...prev, { id: Date.now().toString(), name: '', description: '', order: prev.length + 1 }]);
  };

  const removeStep = (id) => {
    setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (id, field, value) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (steps.some(s => !s.name.trim())) { toast.error('Todas as etapas precisam de um nome'); return; }
    onSave({ name: name.trim(), description, category, steps, runs: initial?.runs || 0, active: initial?.active ?? true });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Processo *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding de Cliente" />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: comercial, qualidade..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o objetivo deste processo..." rows={2} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Etapas do Processo</Label>
          <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={addStep}>
            <Plus className="w-3 h-3" /> Etapa
          </Button>
        </div>
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3 group">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-1">
              {step.order}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={step.name}
                onChange={e => updateStep(step.id, 'name', e.target.value)}
                placeholder={`Nome da etapa ${i + 1}`}
                className="text-sm"
              />
              <Input
                value={step.description}
                onChange={e => updateStep(step.id, 'description', e.target.value)}
                placeholder="Descrição (opcional)"
                className="text-sm"
              />
            </div>
            {steps.length > 1 && (
              <Button
                type="button" variant="ghost" size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                onClick={() => removeStep(step.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Salvar Processo
        </Button>
      </div>
    </div>
  );
}

export default function Processes() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [search, setSearch] = useState('');

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: () => base44.entities.Process.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Process.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setShowForm(false);
      toast.success('Processo criado!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Process.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setEditingProcess(null);
      toast.success('Processo atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Process.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Processo removido.');
    },
  });

  const handleSave = (data) => {
    if (editingProcess) {
      updateMutation.mutate({ id: editingProcess.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (proc) => {
    createMutation.mutate({ ...proc, id: undefined, name: `${proc.name} (cópia)`, runs: 0 });
    toast.success('Processo duplicado!');
  };

  const handleToggle = (proc) => {
    updateMutation.mutate({ id: proc.id, data: { active: !proc.active } });
  };

  const filtered = processes.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = processes.filter(p => p.active).length;
  const totalRuns = processes.reduce((acc, p) => acc + (p.runs || 0), 0);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Processos"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => { setEditingProcess(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Processo</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground/80">
              <strong>Processos</strong> são fluxos de trabalho reutilizáveis que podem ser aplicados a projetos e tarefas.
              Padronize sua operação criando checklists e sequências de etapas para seu time.
            </p>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{processes.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Processos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Ativos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{totalRuns}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Execuções</div>
            </Card>
          </div>

          {(showForm || editingProcess) && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">{editingProcess ? 'Editar Processo' : 'Novo Processo'}</h3>
              <ProcessForm
                initial={editingProcess}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingProcess(null); }}
                isSaving={isSaving}
              />
            </Card>
          )}

          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar processos..."
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Workflow className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold mb-1">Nenhum processo encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? 'Tente outro termo de busca.' : 'Crie processos para padronizar o fluxo de trabalho do seu time.'}
              </p>
              {!search && (
                <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" /> Criar Primeiro Processo
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(process => (
                <ProcessCard
                  key={process.id}
                  process={process}
                  onEdit={(p) => { setEditingProcess(p); setShowForm(false); }}
                  onDuplicate={handleDuplicate}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}