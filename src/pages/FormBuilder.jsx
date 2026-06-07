import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import FormBlockPalette, { FORM_BLOCK_GROUPS } from '@/components/forms/visual/FormBlockPalette';
import FormVisualCanvas from '@/components/forms/visual/FormVisualCanvas';
import FormPropertiesPanel from '@/components/forms/visual/FormPropertiesPanel';
import FormEdgePropertiesPanel from '@/components/forms/visual/FormEdgePropertiesPanel';
import FormTestDialog from '@/components/forms/visual/FormTestDialog';
import FormIntegrationPanel from '@/components/forms/FormIntegrationPanel';
import ResultsBuilder from '@/components/forms/ResultsBuilder';
import FormPreview from '@/components/forms/FormPreview';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  Globe2,
  MoreVertical,
  Play,
  Rocket,
  Save,
  Settings,
  Share2,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateVisualFlow } from '@/lib/form-flow';

const INPUT_FIELD_TYPES = new Set([
  'short_text', 'long_text', 'number', 'date', 'time', 'datetime', 'email', 'phone', 'url', 'currency',
  'file', 'image', 'video', 'signature', 'checkbox', 'multiple_choice', 'single_choice', 'dropdown',
  'scale', 'nps', 'rating', 'matrix', 'custom',
]);

const DEFAULT_START_BLOCK = {
  id: 'start',
  kind: 'start',
  typeLabel: 'Início',
  label: 'Início',
  icon: '🏠',
  category: 'start',
  description: 'Ponto de entrada do formulário',
  position: { x: 40, y: 180 },
};

const EDITOR_TABS = [
  { id: 'editor', label: 'Editor', icon: Sparkles },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'integrations', label: 'Integrações', icon: Share2 },
  { id: 'results', label: 'Resultados', icon: BarChart3 },
  { id: 'publish', label: 'Publicar', icon: Globe2 },
];

function slugifyVariable(label) {
  return (label || 'resposta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'resposta';
}

function getTemplate(kind) {
  return FORM_BLOCK_GROUPS.flatMap(group => group.blocks).find(block => block.kind === kind) || FORM_BLOCK_GROUPS[0].blocks[1];
}

function getDefaultOptions(kind) {
  if (!['single_choice', 'multiple_choice', 'dropdown'].includes(kind)) return undefined;
  return [
    { id: `opt-${Date.now()}-1`, label: 'Opção 1', value: 'opcao_1' },
    { id: `opt-${Date.now()}-2`, label: 'Opção 2', value: 'opcao_2' },
  ];
}


const DEFAULT_QUESTION_BLOCK = {
  ...getTemplate('short_text'),
  id: 'field-default-question',
  label: 'Qual o objetivo principal deste projeto?',
  question: 'Qual o objetivo principal deste projeto?',
  required: true,
  saveAsVariable: true,
  variableName: 'objetivo_principal',
  position: { x: 360, y: 180 },
};

const DEFAULT_EDGE = { id: 'edge-start-default-question', source: 'start', target: 'field-default-question', type: 'smoothstep' };

function createBlockFromTemplate(template, position, index) {
  const label = template.category === 'input' ? 'Nova pergunta' : template.label;
  return {
    ...template,
    id: `${template.category === 'input' ? 'field' : 'block'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    question: template.category === 'input' ? label : undefined,
    required: false,
    saveAsVariable: template.category === 'input',
    variableName: template.category === 'input' ? slugifyVariable(`${template.kind}_${index + 1}`) : undefined,
    options: getDefaultOptions(template.kind),
    position,
  };
}

function fieldToBlock(field, index, visualNode) {
  const template = getTemplate(field.type || 'short_text');
  const label = field.label || `Pergunta ${index + 1}`;
  return {
    ...template,
    id: field.id || `field-${Date.now()}-${index}`,
    formFieldId: field.id,
    label,
    question: label,
    required: !!field.required,
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    options: field.options || getDefaultOptions(field.type),
    validation: field.validation || {},
    saveAsVariable: field.saveAsVariable !== false,
    variableName: field.variableName || slugifyVariable(label),
    position: visualNode?.position || { x: 330 + (index % 3) * 280, y: 120 + Math.floor(index / 3) * 170 },
  };
}

function normalizeVisualFlow(existingForm, fields) {
  const visualFlow = existingForm?.visual_flow || {};
  const visualNodes = visualFlow.blocks || visualFlow.nodes || [];
  const visualEdges = visualFlow.edges || [];
  const fieldBlocks = fields.map((field, index) => fieldToBlock(field, index, visualNodes.find(node => node.id === field.id || node.formFieldId === field.id)));
  const fieldIds = new Set(fieldBlocks.map(block => block.id));
  const nonFieldBlocks = visualNodes.filter(node => !fieldIds.has(node.id) && node.category !== 'input');
  const startBlock = nonFieldBlocks.find(block => block.category === 'start') || DEFAULT_START_BLOCK;
  const otherBlocks = nonFieldBlocks.filter(block => block.category !== 'start');
  const blocks = [startBlock, ...fieldBlocks, ...otherBlocks];

  if (visualEdges.length > 0) {
    return { blocks, edges: visualEdges };
  }

  const generatedEdges = [];
  if (fieldBlocks[0]) {
    generatedEdges.push({ id: 'edge-start-first', source: startBlock.id, target: fieldBlocks[0].id, type: 'smoothstep' });
  }
  fieldBlocks.slice(0, -1).forEach((block, index) => {
    generatedEdges.push({ id: `edge-${block.id}-${fieldBlocks[index + 1].id}`, source: block.id, target: fieldBlocks[index + 1].id, type: 'smoothstep' });
  });

  return { blocks, edges: generatedEdges };
}

function blockToField(block, formId, order) {
  return {
    form_id: formId,
    label: block.question || block.label || `Pergunta ${order + 1}`,
    type: INPUT_FIELD_TYPES.has(block.kind) ? block.kind : 'short_text',
    required: !!block.required,
    placeholder: block.placeholder || '',
    helpText: block.helpText || '',
    options: block.options || [],
    validation: block.validation || {},
    order,
    conditional: !!block.conditional,
    pageBreak: !!block.pageBreak,
    variableName: block.variableName || slugifyVariable(block.question || block.label),
    saveAsVariable: block.saveAsVariable !== false,
  };
}

function blockToPreviewField(block, order) {
  return {
    id: block.id,
    ...blockToField(block, 'preview', order),
  };
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('editor');
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState('field-default-question');
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalFieldIds, setOriginalFieldIds] = useState([]);
  const [form, setForm] = useState({
    title: 'Novo Formulário',
    description: '',
    type: 'form',
    status: 'draft',
    icon: '📋',
    color: '#7c3aed',
    theme: { layout: 'visual', progressBar: true },
    logic: [],
    results: [],
    settings: { captureEmail: false, allowMultipleResponses: true },
    sharing: { public: false, allowEmbed: false },
  });
  const [blocks, setBlocks] = useState([DEFAULT_START_BLOCK, DEFAULT_QUESTION_BLOCK]);
  const [edges, setEdges] = useState([DEFAULT_EDGE]);

  const { data: existingForm, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => (id ? base44.entities.Form.get(id) : null),
    enabled: !!id,
  });

  useEffect(() => {
    if (!existingForm) return;

    setForm({
      ...existingForm,
      theme: { layout: 'visual', progressBar: true, ...(existingForm.theme || {}) },
      settings: existingForm.settings || {},
      sharing: existingForm.sharing || {},
      results: existingForm.results || [],
      logic: existingForm.logic || [],
    });

    base44.entities.FormField.filter({ form_id: id }, 'order').then((loadedFields = []) => {
      const fallbackFields = loadedFields.length ? loadedFields : (existingForm.fields || []).filter(field => typeof field === 'object');
      setOriginalFieldIds(fallbackFields.filter(field => field.id).map(field => field.id));
      const visual = normalizeVisualFlow(existingForm, fallbackFields);
      setBlocks(visual.blocks);
      setEdges(visual.edges);
      setSelectedBlockId(visual.blocks.find(block => block.category === 'input')?.id || visual.blocks[0]?.id || null);
    });
  }, [existingForm, id]);

  const selectedBlock = useMemo(() => blocks.find(block => block.id === selectedBlockId), [blocks, selectedBlockId]);
  const selectedEdge = useMemo(() => edges.find(edge => edge.id === selectedEdgeId), [edges, selectedEdgeId]);
  const selectedEdgeSource = useMemo(() => blocks.find(block => block.id === selectedEdge?.source), [blocks, selectedEdge]);
  const selectedEdgeTarget = useMemo(() => blocks.find(block => block.id === selectedEdge?.target), [blocks, selectedEdge]);
  const inputBlocks = useMemo(() => blocks.filter(block => block.category === 'input'), [blocks]);
  const previewFields = useMemo(() => inputBlocks.map(blockToPreviewField), [inputBlocks]);
  const flowValidation = useMemo(() => validateVisualFlow(blocks, edges), [blocks, edges]);

  const updateSelectedBlock = (updatedBlock) => {
    setBlocks(currentBlocks => currentBlocks.map(block => block.id === updatedBlock.id ? updatedBlock : block));
  };

  const updateSelectedEdge = (updatedEdge) => {
    setEdges(currentEdges => currentEdges.map(edge => edge.id === updatedEdge.id ? updatedEdge : edge));
  };

  const addBlock = (template, position) => {
    if (template.kind === 'start' && blocks.some(block => block.category === 'start')) {
      toast.info('Este formulário já possui um bloco de início.');
      return;
    }
    const block = createBlockFromTemplate(template, position, inputBlocks.length);
    setBlocks(currentBlocks => [...currentBlocks, block]);
    setSelectedEdgeId(null);
    setSelectedBlockId(block.id);
  };

  const deleteSelectedBlock = () => {
    if (!selectedBlockId || selectedBlockId === 'start') return;
    setBlocks(currentBlocks => currentBlocks.filter(block => block.id !== selectedBlockId));
    setEdges(currentEdges => currentEdges.filter(edge => edge.source !== selectedBlockId && edge.target !== selectedBlockId));
    setSelectedBlockId(null);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges(currentEdges => currentEdges.filter(edge => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const saveForm = async (formOverrides = {}, successMessage = 'Formulário salvo com sucesso!') => {
    setSaving(true);
    try {
      let formId = id;
      const formToSave = {
        ...form,
        ...formOverrides,
        theme: { ...(form.theme || {}), ...(formOverrides.theme || {}) },
        settings: { ...(form.settings || {}), ...(formOverrides.settings || {}) },
        sharing: { ...(form.sharing || {}), ...(formOverrides.sharing || {}) },
      };
      const baseFormData = {
        ...formToSave,
        visual_flow: { blocks, edges },
        fields: [],
      };

      if (formId) {
        await base44.entities.Form.update(formId, baseFormData);
      } else {
        const created = await base44.entities.Form.create(baseFormData);
        formId = created.id;
      }

      const savedFieldIds = [];
      for (const [order, block] of inputBlocks.entries()) {
        const fieldData = blockToField(block, formId, order);
        if (block.formFieldId) {
          await base44.entities.FormField.update(block.formFieldId, fieldData);
          savedFieldIds.push(block.formFieldId);
        } else if (block.id && !String(block.id).startsWith('field-')) {
          await base44.entities.FormField.update(block.id, fieldData);
          savedFieldIds.push(block.id);
        } else {
          const createdField = await base44.entities.FormField.create(fieldData);
          savedFieldIds.push(createdField.id);
          block.formFieldId = createdField.id;
          block.id = createdField.id;
        }
      }

      const removedFieldIds = originalFieldIds.filter(fieldId => !savedFieldIds.includes(fieldId));
      await Promise.all(removedFieldIds.map(fieldId => base44.entities.FormField.delete(fieldId).catch(() => null)));

      const persistedBlocks = blocks.map(block => {
        const savedIndex = inputBlocks.findIndex(inputBlock => inputBlock.id === block.id || inputBlock.formFieldId === block.formFieldId);
        return savedIndex >= 0 ? { ...block, id: savedFieldIds[savedIndex], formFieldId: savedFieldIds[savedIndex] } : block;
      });
      const idMap = new Map(inputBlocks.map((block, index) => [block.id, savedFieldIds[index]]));
      const persistedEdges = edges.map(edge => ({
        ...edge,
        source: idMap.get(edge.source) || edge.source,
        target: idMap.get(edge.target) || edge.target,
      }));

      await base44.entities.Form.update(formId, {
        ...baseFormData,
        fields: savedFieldIds,
        visual_flow: { blocks: persistedBlocks, edges: persistedEdges },
      });

      setForm(formToSave);
      setBlocks(persistedBlocks);
      setEdges(persistedEdges);
      setOriginalFieldIds(savedFieldIds);
      setSelectedBlockId(current => idMap.get(current) || current);
      toast.success(successMessage);
      if (!id) navigate(`/forms/${formId}/edit`, { replace: true });
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast.error(error.message || 'Não foi possível salvar o formulário.');
    } finally {
      setSaving(false);
    }
  };

  const publishForm = () => {
    if (flowValidation.errors.length) {
      setActiveTab('publish');
      toast.error('Corrija os erros do fluxo antes de publicar.');
      return;
    }

    saveForm({
      status: 'active',
      sharing: { ...(form.sharing || {}), public: true },
    }, 'Formulário publicado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 shadow-2xl backdrop-blur">
        <div className="flex min-w-0 items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/forms')} className="text-slate-300 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Bot className="h-3.5 w-3.5 text-violet-400" /> Editor Visual de Formulários
            </p>
            <Input
              value={form.title}
              onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))}
              className="mt-1 h-auto min-w-[220px] border-0 !bg-transparent p-0 text-lg font-bold !text-white shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {EDITOR_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm transition',
                  activeTab === tab.id ? 'border-violet-400 text-white' : 'border-transparent text-slate-400 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="hidden border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 sm:inline-flex">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setTestOpen(true)} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
            <Play className="h-4 w-4" /> Testar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={saveForm} disabled={saving} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
            <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" size="sm" onClick={() => setActiveTab('publish')} className="bg-violet-600 text-white hover:bg-violet-500">
            <Rocket className="h-4 w-4" /> Publicar
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:bg-white/10 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {activeTab === 'editor' ? (
        <div className="flex min-h-0 flex-1">
          <FormBlockPalette collapsed={paletteCollapsed} onToggleCollapsed={() => setPaletteCollapsed(current => !current)} />
          <main className="min-w-0 flex-1">
            <ReactFlowProvider>
              <FormVisualCanvas
                blocks={blocks}
                edges={edges}
                selectedBlockId={selectedBlockId}
                selectedEdgeId={selectedEdgeId}
                onBlocksChange={setBlocks}
                onEdgesChange={setEdges}
                onSelectBlock={setSelectedBlockId}
                onSelectEdge={setSelectedEdgeId}
                onAddBlock={addBlock}
                onDeleteSelected={selectedEdgeId ? deleteSelectedEdge : deleteSelectedBlock}
              />
            </ReactFlowProvider>
          </main>
          {selectedEdge ? (
            <FormEdgePropertiesPanel
              edge={selectedEdge}
              sourceBlock={selectedEdgeSource}
              targetBlock={selectedEdgeTarget}
              onUpdate={updateSelectedEdge}
              onDelete={deleteSelectedEdge}
              onClose={() => setSelectedEdgeId(null)}
            />
          ) : (
            <FormPropertiesPanel
              block={selectedBlock}
              onUpdate={updateSelectedBlock}
              onDelete={deleteSelectedBlock}
              onClose={() => setSelectedBlockId(null)}
            />
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
          {activeTab === 'settings' && (
            <div className="mx-auto max-w-4xl space-y-6">
              <Card>
                <CardHeader><CardTitle>Configurações do formulário</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                    <div className="space-y-2">
                      <Label>Ícone</Label>
                      <Input value={form.icon || ''} onChange={(event) => setForm(current => ({ ...current, icon: event.target.value }))} maxLength={2} className="text-center text-3xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={form.description || ''} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} rows={4} placeholder="Explique o objetivo do formulário..." />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <select value={form.type} onChange={(event) => setForm(current => ({ ...current, type: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                        <option value="form">Formulário</option>
                        <option value="survey">Pesquisa</option>
                        <option value="quiz">Quiz</option>
                        <option value="diagnostic">Diagnóstico</option>
                        <option value="intake">Intake/Briefing</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select value={form.status} onChange={(event) => setForm(current => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativo</option>
                        <option value="paused">Pausado</option>
                        <option value="closed">Fechado</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border p-4">
                      <span><span className="block font-medium">Barra de progresso</span><span className="text-sm text-muted-foreground">Mostra avanço ao respondente</span></span>
                      <Switch checked={form.theme?.progressBar !== false} onCheckedChange={(checked) => setForm(current => ({ ...current, theme: { ...(current.theme || {}), progressBar: checked } }))} />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border p-4">
                      <span><span className="block font-medium">Múltiplas respostas</span><span className="text-sm text-muted-foreground">Permite mais de uma submissão</span></span>
                      <Switch checked={!!form.settings?.allowMultipleResponses} onCheckedChange={(checked) => setForm(current => ({ ...current, settings: { ...(current.settings || {}), allowMultipleResponses: checked } }))} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'integrations' && <div className="mx-auto max-w-4xl"><FormIntegrationPanel form={form} onUpdate={setForm} /></div>}

          {activeTab === 'results' && (
            <div className="mx-auto max-w-4xl">
              <Card>
                <CardHeader><CardTitle>Páginas de resultado</CardTitle></CardHeader>
                <CardContent><ResultsBuilder results={form.results || []} onUpdate={(results) => setForm(current => ({ ...current, results }))} /></CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'publish' && (
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_380px]">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {flowValidation.errors.length ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    Validação do fluxo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!flowValidation.issues.length ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <span>Fluxo pronto para publicação.</span>
                    </div>
                  ) : (
                    flowValidation.issues.map((issue, index) => (
                      <div
                        key={`${issue.code}-${issue.targetId || index}`}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-4 text-sm',
                          issue.severity === 'error'
                            ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                        )}
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <div className="font-medium">{issue.severity === 'error' ? 'Erro' : 'Aviso'}</div>
                          <div>{issue.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Publicação</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center justify-between rounded-xl border p-4">
                    <span><span className="block font-medium">Link público</span><span className="text-sm text-muted-foreground">Permite acesso por link depois de salvar</span></span>
                    <Switch checked={!!form.sharing?.public} onCheckedChange={(checked) => setForm(current => ({ ...current, sharing: { ...(current.sharing || {}), public: checked } }))} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border p-4">
                    <span><span className="block font-medium">Permitir incorporação</span><span className="text-sm text-muted-foreground">Libera uso via embed/iframe</span></span>
                    <Switch checked={!!form.sharing?.allowEmbed} onCheckedChange={(checked) => setForm(current => ({ ...current, sharing: { ...(current.sharing || {}), allowEmbed: checked } }))} />
                  </label>
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    A publicação valida o fluxo visual antes de ativar o formulário. Conexões quebradas, perguntas vazias e blocos essenciais ausentes bloqueiam a publicação.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={publishForm} disabled={saving || flowValidation.errors.length > 0} className="gap-2">
                      <Rocket className="h-4 w-4" />
                      {saving ? 'Publicando...' : 'Salvar e publicar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setTestOpen(true)} className="gap-2">
                      <Play className="h-4 w-4" />
                      Testar fluxo
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</CardTitle></CardHeader>
                <CardContent><FormPreview form={form} fields={previewFields} /></CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <FormTestDialog open={testOpen} onOpenChange={setTestOpen} form={form} blocks={blocks} edges={edges} />
    </div>
  );
}
