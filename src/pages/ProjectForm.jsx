import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6b7280'];

export default function ProjectForm() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id && id !== 'new';

  const [form, setForm] = useState({
    name: '', code: '', description: '', client_id: '', priority: 'medium',
    status: 'not_started', start_date: '', due_date: '', color: '#6366f1', notes: '', tags: [],
  });

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.filter({ id }),
    enabled: isEdit,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  useEffect(() => {
    if (project?.[0]) {
      setForm({ ...form, ...project[0] });
    }
  }, [project]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) return base44.entities.Project.update(id, data);
      return base44.entities.Project.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(isEdit ? 'Projeto atualizado!' : 'Projeto criado!');
      navigate('/projects');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    saveMutation.mutate(form);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title={isEdit ? 'Editar Projeto' : 'Novo Projeto'}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nome do projeto" />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={form.code} onChange={e => updateField('code', e.target.value)} placeholder="PRJ-001" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Descreva o projeto..." rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.client_id || ''} onValueChange={v => updateField('client_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => updateField('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data de Entrega</Label>
                  <Input type="date" value={form.due_date} onChange={e => updateField('due_date', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('color', c)}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Notas adicionais..." rows={2} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending} className="gap-1.5">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}