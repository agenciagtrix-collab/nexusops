import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import PromptEditor from '@/components/ai-agents/PromptEditor';
import PermissionsGrid from '@/components/ai-agents/PermissionsGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Save, Bot, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'strategy', label: '♟️ Estratégico' },
  { value: 'legal', label: '⚖️ Jurídico' },
  { value: 'financial', label: '💰 Financeiro' },
  { value: 'marketing', label: '📢 Marketing' },
  { value: 'pmo', label: '📋 PMO' },
  { value: 'sales', label: '🎯 Vendas' },
  { value: 'technical', label: '💻 Técnico' },
  { value: 'hr', label: '👥 RH' },
  { value: 'operations', label: '⚙️ Operações' },
  { value: 'design', label: '🎨 Design' },
  { value: 'custom', label: '🤖 Personalizado' },
];

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Amigável' },
  { value: 'technical', label: 'Técnico' },
  { value: 'direct', label: 'Direto' },
  { value: 'consultative', label: 'Consultivo' },
];

const MODELS = [
  { value: 'native', label: '⚡ Nativo (Base44)' },
  { value: 'gemini_flash', label: '✨ Gemini Flash' },
  { value: 'claude_sonnet', label: '🤖 Claude Sonnet' },
  { value: 'openai_gpt4', label: '🟢 OpenAI GPT-4' },
  { value: 'deepseek', label: '🔵 DeepSeek' },
  { value: 'grok', label: '🦅 Grok' },
];

const LEVELS = [
  { value: 'global', label: 'Global', desc: 'Disponível para toda a plataforma', cls: 'border-purple-200 bg-purple-50/50 text-purple-700' },
  { value: 'organization', label: 'Organização', desc: 'Disponível apenas para esta organização', cls: 'border-blue-200 bg-blue-50/50 text-blue-700' },
  { value: 'project', label: 'Projeto', desc: 'Vinculado a projetos específicos', cls: 'border-green-200 bg-green-50/50 text-green-700' },
];

const EMOJI_PRESETS = ['🤖', '🧠', '⚖️', '💰', '📢', '📋', '🎯', '💻', '👥', '⚙️', '🎨', '🔍', '🚀', '🌟', '🦾', '📊'];
const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#64748b'];

const EMPTY_FORM = {
  name: '', description: '', speciality: '', category: 'custom',
  avatar_emoji: '🤖', avatar_color: '#6366f1', objective: '',
  prompt_base: '', prompt_behavior: '', prompt_limitations: '', prompt_rules: '',
  communication_tone: 'consultative', model: 'native',
  hierarchy_level: 'organization', status: 'active',
  permissions: ['projects', 'tasks', 'timelines', 'teams'],
  is_proactive: false, is_template: false, project_ids: [], tags: [],
};

const TABS = [
  { key: 'identity', label: 'Identidade' },
  { key: 'prompt', label: 'Editor de Prompt' },
  { key: 'permissions', label: 'Permissões' },
  { key: 'settings', label: 'Configurações' },
];

export default function AIAgentForm() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [activeTab, setActiveTab] = useState('identity');
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: agentData, isLoading: loadingAgent } = useQuery({
    queryKey: ['ai-agent', id],
    queryFn: () => base44.entities.AIAgent.filter({ id }),
    enabled: isEdit,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  useEffect(() => {
    if (agentData?.length > 0) {
      const agent = agentData[0];
      setForm({ ...EMPTY_FORM, ...agent });
    }
  }, [agentData]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setPrompt = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.AIAgent.update(id, data)
      : base44.entities.AIAgent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success(isEdit ? 'Agente atualizado!' : 'Agente criado!');
      navigate('/ai-agents');
    },
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.speciality.trim()) {
      toast.error('Nome e especialidade são obrigatórios');
      return;
    }
    saveMutation.mutate(form);
  };

  const toggleProject = (pid) => {
    const ids = form.project_ids || [];
    set('project_ids', ids.includes(pid) ? ids.filter(x => x !== pid) : [...ids, pid]);
  };

  if (isEdit && loadingAgent) {
    return (
      <>
        <TopBar onMenuToggle={onMenuToggle} title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ai-agents')} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Agente
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

          {/* Page Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading">{isEdit ? 'Editar Agente' : 'Novo Agente IA'}</h1>
              <p className="text-xs text-muted-foreground">Configure o especialista virtual</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                  activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* Avatar Preview */}
              <Card className="p-5">
                <div className="flex items-center gap-5">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0"
                    style={{ backgroundColor: form.avatar_color }}
                  >
                    {form.avatar_emoji || '🤖'}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">Emoji do Agente</Label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_PRESETS.map(e => (
                          <button key={e} onClick={() => set('avatar_emoji', e)}
                            className={cn("text-xl p-1.5 rounded-lg transition-colors", form.avatar_emoji === e ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted")}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Cor do Avatar</Label>
                      <div className="flex gap-2">
                        {COLOR_PRESETS.map(c => (
                          <button key={c} onClick={() => set('avatar_color', c)}
                            className={cn("w-7 h-7 rounded-full transition-all", form.avatar_color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105")}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs mb-1.5 block">Nome do Agente *</Label>
                    <Input placeholder="Ex: PMO Especialista" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs mb-1.5 block">Especialidade *</Label>
                    <Input placeholder="Ex: Gestão de Projetos e Cronogramas" value={form.speciality} onChange={e => set('speciality', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Categoria</Label>
                    <Select value={form.category} onValueChange={v => set('category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Tom de Comunicação</Label>
                    <Select value={form.communication_tone} onValueChange={v => set('communication_tone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs mb-1.5 block">Descrição</Label>
                    <Textarea placeholder="Descreva o papel deste agente na equipe..." rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} className="resize-none" />
                  </div>
                </div>
              </Card>

              {/* Hierarchy */}
              <Card className="p-5 space-y-3">
                <p className="text-sm font-semibold">Nível Hierárquico</p>
                <div className="grid grid-cols-1 gap-2">
                  {LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => set('hierarchy_level', level.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        form.hierarchy_level === level.value ? cn("border-2", level.cls) : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{level.label}</p>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                      </div>
                      {form.hierarchy_level === level.value && <span className="w-2.5 h-2.5 rounded-full bg-current flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Linked Projects */}
              {projects.length > 0 && (
                <Card className="p-5 space-y-3">
                  <p className="text-sm font-semibold">Projetos Vinculados</p>
                  <p className="text-xs text-muted-foreground">O agente terá acesso ao contexto destes projetos</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projects.map(project => (
                      <label key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.project_ids || []).includes(project.id)}
                          onChange={() => toggleProject(project.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <span className="text-sm">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* PROMPT EDITOR */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary">
                  Configure cada bloco do prompt. O tom de comunicação e o modelo escolhidos serão injetados automaticamente.
                </p>
              </div>
              <PromptEditor values={form} onChange={setPrompt} />
            </div>
          )}

          {/* PERMISSIONS */}
          {activeTab === 'permissions' && (
            <Card className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold">Controle de Acesso</p>
                <p className="text-xs text-muted-foreground mt-0.5">Defina quais informações este agente pode acessar para contextualizar suas respostas</p>
              </div>
              <PermissionsGrid
                selected={form.permissions || []}
                onChange={(perms) => set('permissions', perms)}
              />
            </Card>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <p className="text-sm font-semibold">Modelo de IA</p>
                <div className="grid grid-cols-1 gap-2">
                  {MODELS.map(model => (
                    <button
                      key={model.value}
                      onClick={() => set('model', model.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        form.model === model.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                      )}
                    >
                      <span className="text-base">{model.label.split(' ')[0]}</span>
                      <span className="text-sm font-medium flex-1">{model.label.substring(model.label.indexOf(' ') + 1)}</span>
                      {form.model === model.value && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <p className="text-sm font-semibold">Comportamento</p>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Status do Agente</p>
                    <p className="text-xs text-muted-foreground">Agentes inativos não podem ser acionados</p>
                  </div>
                  <Switch
                    checked={form.status === 'active'}
                    onCheckedChange={v => set('status', v ? 'active' : 'inactive')}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Monitoramento Proativo</p>
                    <p className="text-xs text-muted-foreground">O agente monitora projetos e gera alertas automáticos</p>
                  </div>
                  <Switch
                    checked={!!form.is_proactive}
                    onCheckedChange={v => set('is_proactive', v)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Modelo Reutilizável</p>
                    <p className="text-xs text-muted-foreground">Disponível na biblioteca para duplicação</p>
                  </div>
                  <Switch
                    checked={!!form.is_template}
                    onCheckedChange={v => set('is_template', v)}
                  />
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pb-8">
            <Button variant="outline" onClick={() => navigate('/ai-agents')}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Agente
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}