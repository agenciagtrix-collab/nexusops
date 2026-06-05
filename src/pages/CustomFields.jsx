import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, Edit2, Type, Hash, DollarSign, Calendar, Clock,
  CheckSquare, List, Star, Percent, Link, Phone, Mail, User,
  Building2, FolderKanban, File, Sliders, Check, AlignLeft, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const fieldTypes = [
  { key: 'text', label: 'Texto', icon: Type },
  { key: 'textarea', label: 'Texto Longo', icon: AlignLeft },
  { key: 'number', label: 'Número', icon: Hash },
  { key: 'currency', label: 'Moeda', icon: DollarSign },
  { key: 'date', label: 'Data', icon: Calendar },
  { key: 'time', label: 'Hora', icon: Clock },
  { key: 'datetime', label: 'Data e Hora', icon: Calendar },
  { key: 'status', label: 'Status', icon: Sliders },
  { key: 'priority', label: 'Prioridade', icon: Sliders },
  { key: 'select', label: 'Seleção Única', icon: List },
  { key: 'multiselect', label: 'Seleção Múltipla', icon: CheckSquare },
  { key: 'checkbox', label: 'Checkbox', icon: Check },
  { key: 'url', label: 'URL', icon: Link },
  { key: 'phone', label: 'Telefone', icon: Phone },
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'user', label: 'Usuário', icon: User },
  { key: 'client', label: 'Cliente', icon: Building2 },
  { key: 'project', label: 'Projeto', icon: FolderKanban },
  { key: 'file', label: 'Arquivo', icon: File },
  { key: 'rating', label: 'Avaliação', icon: Star },
  { key: 'percent', label: 'Percentual', icon: Percent },
  { key: 'tags', label: 'Etiquetas', icon: List },
];

const entityTargets = [
  { key: 'task', label: 'Tarefas' },
  { key: 'project', label: 'Projetos' },
  { key: 'client', label: 'Clientes' },
  { key: 'team', label: 'Equipes' },
];

function FieldTypeIcon({ type, className }) {
  const found = fieldTypes.find(f => f.key === type);
  const Icon = found?.icon || Type;
  return <Icon className={className} />;
}

function FieldForm({ onSave, onCancel, initial, isSaving }) {
  const [name, setName] = useState(initial?.name || '');
  const [type, setType] = useState(initial?.type || 'text');
  const [entity, setEntity] = useState(initial?.entity || 'task');
  const [required, setRequired] = useState(initial?.required || false);
  const [options, setOptions] = useState(initial?.options?.join(', ') || '');
  const [description, setDescription] = useState(initial?.description || '');

  const needsOptions = ['select', 'multiselect', 'status'].includes(type);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    onSave({
      name: name.trim(),
      type,
      entity,
      required,
      description: description.trim() || undefined,
      options: needsOptions ? options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Campo *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Horas faturáveis" />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map(ft => (
                <SelectItem key={ft.key} value={ft.key}>
                  <div className="flex items-center gap-2">
                    <ft.icon className="w-4 h-4 text-muted-foreground" />
                    {ft.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Aplicar em</Label>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {entityTargets.map(et => (
                <SelectItem key={et.key} value={et.key}>{et.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Obrigatório</Label>
          <Select value={required ? 'yes' : 'no'} onValueChange={v => setRequired(v === 'yes')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Não</SelectItem>
              <SelectItem value="yes">Sim</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {needsOptions && (
        <div className="space-y-2">
          <Label>Opções (separadas por vírgula)</Label>
          <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="Ex: Dev, Staging, Produção" />
        </div>
      )}
      <div className="space-y-2">
        <Label>Descrição / Dica (opcional)</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Instrução para o usuário" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Salvar Campo
        </Button>
      </div>
    </div>
  );
}

export default function CustomFields() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [filterEntity, setFilterEntity] = useState('all');

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: () => base44.entities.CustomField.list('name', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomField.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setShowForm(false);
      toast.success('Campo criado!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomField.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setEditingField(null);
      toast.success('Campo atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomField.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast.success('Campo removido.');
    },
  });

  const handleSave = (data) => {
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const filtered = fields.filter(f => filterEntity === 'all' || f.entity === filterEntity);
  const fieldsByEntity = entityTargets.map(et => ({
    ...et,
    count: fields.filter(f => f.entity === et.key).length,
  }));

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Campos Personalizados"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => { setEditingField(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Campo</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground/80">
              <strong>Campos personalizados</strong> permitem adicionar informações específicas do seu fluxo de trabalho a Tarefas, Projetos, Clientes e Equipes.
            </p>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fieldsByEntity.map(et => (
              <Card
                key={et.key}
                className={cn("p-4 text-center cursor-pointer hover:shadow-md transition-shadow", filterEntity === et.key && "ring-2 ring-primary")}
                onClick={() => setFilterEntity(filterEntity === et.key ? 'all' : et.key)}
              >
                <div className="text-2xl font-bold">{et.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{et.label}</div>
              </Card>
            ))}
          </div>

          {/* Form */}
          {(showForm || editingField) && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">{editingField ? 'Editar Campo' : 'Novo Campo'}</h3>
              <FieldForm
                initial={editingField}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingField(null); }}
                isSaving={isSaving}
              />
            </Card>
          )}

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterEntity('all')}
              className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                filterEntity === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
            >
              Todos ({fields.length})
            </button>
            {entityTargets.map(et => (
              <button
                key={et.key}
                onClick={() => setFilterEntity(et.key)}
                className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                  filterEntity === et.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
              >
                {et.label} ({fields.filter(f => f.entity === et.key).length})
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Sliders className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum campo personalizado criado ainda.</p>
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Criar Primeiro Campo
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(field => {
                const typeInfo = fieldTypes.find(ft => ft.key === field.type);
                const entityInfo = entityTargets.find(et => et.key === field.entity);
                return (
                  <Card key={field.id} className="p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FieldTypeIcon type={field.type} className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{field.name}</span>
                        {field.required && (
                          <span className="text-xs text-destructive bg-destructive/10 px-1.5 rounded">Obrigatório</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{typeInfo?.label}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{entityInfo?.label}</span>
                        {field.options?.length > 0 && (
                          <span className="text-xs text-muted-foreground">{field.options.length} opções</span>
                        )}
                        {field.description && (
                          <span className="text-xs text-muted-foreground italic truncate max-w-[160px]">{field.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setEditingField(field); setShowForm(false); }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"
                        onClick={() => deleteMutation.mutate(field.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}