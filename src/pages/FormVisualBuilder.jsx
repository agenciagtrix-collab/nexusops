import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from 'reactflow';
import {
  ArrowLeft,
  Bot,
  Check,
  Eye,
  Globe,
  Loader2,
  MoreVertical,
  Play,
  Save,
  Settings,
  Share2,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormBlockPalette from '@/components/forms/visual/FormBlockPalette';
import FormIntegrationPanel from '@/components/forms/FormIntegrationPanel';
import FormPreview from '@/components/forms/FormPreview';
import FormPropertiesPanel from '@/components/forms/visual/FormPropertiesPanel';
import FormVisualCanvas from '@/components/forms/visual/FormVisualCanvas';
import FormVisualSimulator from '@/components/forms/visual/FormVisualSimulator';
import ResultsBuilder from '@/components/forms/ResultsBuilder';

const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'number',
  'date',
  'time',
  'datetime',
  'email',
  'phone',
  'url',
  'currency',
  'file',
  'image',
  'video',
  'signature',
  'checkbox',
  'multiple_choice',
  'single_choice',
  'dropdown',
  'scale',
  'nps',
  'rating',
  'matrix',
  'custom',
];

const DEFAULT_OPTIONS = [
  { id: 'opt-1', label: 'Opcao 1', value: 'opcao_1' },
  { id: 'opt-2', label: 'Opcao 2', value: 'opcao_2' },
];

const DEFAULT_FORM = {
  title: 'Novo Formulario',
  description: '',
  type: 'form',
  status: 'draft',
  icon: 'P',
  color: '#6d5dfc',
  fields: [],
  theme: { layout: 'single', progressBar: true },
  logic: [],
  results: [],
  settings: {},
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `campo_${Date.now()}`;
}

function createNode(type, position, order = 0) {
  const isChoice = ['single_choice', 'multiple_choice', 'dropdown'].includes(type);
  const labelMap = {
    start: 'Inicio',
    condition: 'Condicao',
    split: 'Divisao de fluxo',
    result: 'Resultado',
    end: 'Encerrar formulario',
    create_client: 'Criar cliente',
    create_project: 'Criar projeto',
    create_task: 'Criar tarefa',
    send_email: 'Enviar e-mail',
    automation: 'Automacao',
    ai_analyze: 'Analisar resposta',
    ai_suggest: 'Sugerir resultado',
  };
  const label = labelMap[type] || 'Nova pergunta';

  return {
    id: `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    label,
    order,
    position,
    data: {
      label,
      question: QUESTION_TYPES.includes(type) ? label : '',
      required: false,
      options: isChoice ? DEFAULT_OPTIONS : [],
      variableName: QUESTION_TYPES.includes(type) ? slugify(label) : '',
    },
  };
}

function fieldToNode(field, index) {
  return {
    id: field.visualNodeId || field.id || `field-${index}`,
    type: field.type || 'short_text',
    label: field.label || `Pergunta ${index + 1}`,
    order: field.order ?? index,
    position: field.position || { x: 80 + (index % 2) * 280, y: 100 + index * 120 },
    data: {
      ...field,
      question: field.label || `Pergunta ${index + 1}`,
      variableName: field.variableName || slugify(field.label),
    },
  };
}

function nodesToFields(nodes, formId) {
  return nodes
    .filter(node => QUESTION_TYPES.includes(node.type))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((node, index) => ({
      id: node.data?.fieldId,
      form_id: formId || 'temp',
      label: node.data?.question || node.label || `Pergunta ${index + 1}`,
      type: node.type,
      required: node.data?.required || false,
      placeholder: node.data?.placeholder || '',
      helpText: node.data?.helpText || '',
      options: node.data?.options || [],
      validation: node.data?.validation || {},
      conditional: node.data?.conditional || false,
      pageBreak: node.data?.pageBreak || false,
      order: index,
      variableName: node.data?.variableName || slugify(node.label),
      visualNodeId: node.id,
      position: node.position,
    }));
}

function buildSequentialEdges(nodes) {
  const ordered = [...nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return ordered.slice(0, -1).map((node, index) => ({
    id: `edge-${node.id}-${ordered[index + 1].id}`,
    source: node.id,
    target: ordered[index + 1].id,
    label: '',
  }));
}

export default function FormVisualBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('editor');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [deletedFieldIds, setDeletedFieldIds] = useState([]);

  const { data: existingForm, isLoading: isLoadingForm } = useQuery({
    queryKey: ['form', id],
    queryFn: () => (id ? base44.entities.Form.get(id) : null),
    enabled: !!id,
  });

  const { data: existingFields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ['form-fields', id],
    queryFn: () => base44.entities.FormField.filter({ form_id: id }),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) {
      const startNode = createNode('start', { x: 80, y: 180 }, 0);
      setNodes([startNode]);
      setEdges([]);
      return;
    }

    if (!existingForm) return;

    setForm({
      ...DEFAULT_FORM,
      ...existingForm,
      settings: existingForm.settings || {},
      theme: existingForm.theme || DEFAULT_FORM.theme,
    });

    const visual = existingForm.settings?.visualBuilder;
    if (visual?.nodes?.length) {
      setNodes(visual.nodes);
      setEdges(visual.edges || buildSequentialEdges(visual.nodes));
      return;
    }

    if (existingFields.length) {
      const fieldNodes = existingFields
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(fieldToNode);
      const startNode = createNode('start', { x: 80, y: 80 }, 0);
      const preparedNodes = [
        startNode,
        ...fieldNodes.map((node, index) => ({
          ...node,
          order: index + 1,
          position: { x: 360, y: 80 + index * 140 },
          data: { ...node.data, fieldId: node.data.id },
        })),
      ];
      setNodes(preparedNodes);
      setEdges(buildSequentialEdges(preparedNodes));
    }
  }, [existingFields, existingForm, id]);

  const selectedNode = useMemo(
    () => nodes.find(node => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const fields = useMemo(() => nodesToFields(nodes, id), [id, nodes]);

  const addBlock = (type, position) => {
    const maxOrder = nodes.reduce((max, node) => Math.max(max, node.order ?? 0), 0);
    const newNode = createNode(type, position || { x: 360, y: 120 + maxOrder * 90 }, maxOrder + 1);
    const previousNode = [...nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).at(-1);

    setNodes(prev => [...prev, newNode]);
    if (previousNode) {
      setEdges(prev => [...prev, {
        id: `edge-${previousNode.id}-${newNode.id}`,
        source: previousNode.id,
        target: newNode.id,
        label: '',
      }]);
    }
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (updatedNode) => {
    setNodes(prev => prev.map(node => (node.id === updatedNode.id ? updatedNode : node)));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.type === 'start') return;
    if (selectedNode.data?.fieldId) {
      setDeletedFieldIds(prev => [...new Set([...prev, selectedNode.data.fieldId])]);
    }
    setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
    setEdges(prev => prev.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNodeId(null);
  };

  const handleCanvasChange = ({ nodes: nextNodes, edges: nextEdges }) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      let formId = id;
      const visualBuilder = { nodes, edges };
      const nextForm = {
        ...form,
        status: publish ? 'active' : form.status,
        fields,
        settings: {
          ...(form.settings || {}),
          visualBuilder,
        },
      };

      if (id) {
        await base44.entities.Form.update(id, nextForm);
      } else {
        const created = await base44.entities.Form.create(nextForm);
        formId = created.id;
      }

      const savedNodes = [...nodes];
      const preparedFields = nodesToFields(savedNodes, formId);

      for (const fieldId of deletedFieldIds) {
        await base44.entities.FormField.delete(fieldId);
      }

      for (const field of preparedFields) {
        const payload = { ...field, form_id: formId };
        if (field.id) {
          await base44.entities.FormField.update(field.id, payload);
        } else {
          const createdField = await base44.entities.FormField.create(payload);
          const nodeIndex = savedNodes.findIndex(node => node.id === field.visualNodeId);
          if (nodeIndex !== -1) {
            savedNodes[nodeIndex] = {
              ...savedNodes[nodeIndex],
              data: {
                ...savedNodes[nodeIndex].data,
                fieldId: createdField.id,
              },
            };
          }
        }
      }

      await base44.entities.Form.update(formId, {
        ...nextForm,
        fields: preparedFields.map(field => ({ ...field, form_id: formId })),
        settings: {
          ...(nextForm.settings || {}),
          visualBuilder: { nodes: savedNodes, edges },
        },
      });

      setNodes(savedNodes);
      setDeletedFieldIds([]);
      setForm(prev => ({ ...prev, status: publish ? 'active' : prev.status }));
      setSaveMessage(publish ? 'Formulario publicado.' : 'Formulario salvo.');

      if (!id) {
        navigate(`/forms/${formId}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Erro ao salvar formulario visual:', error);
      setSaveMessage('Nao foi possivel salvar. Verifique os dados e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingForm || isLoadingFields) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/forms')}
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Formulario visual</div>
            <Input
              value={form.title}
              onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))}
              className="h-7 border-0 bg-transparent px-0 text-base font-semibold text-slate-100 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <div className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              {saveMessage}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSimulatorOpen(true)}
            className="gap-2 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
          >
            <Play className="h-4 w-4" />
            Testar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="gap-2 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
          <Button type="button" onClick={() => handleSave(true)} disabled={isSaving} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Publicar
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-slate-800 bg-slate-950">
          <TabsList className="bg-transparent">
            <TabsTrigger value="editor" className="gap-2 data-[state=active]:bg-slate-900">
              <Workflow className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-slate-900">
              <Settings className="h-4 w-4" />
              Configuracoes
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-slate-900">
              <Bot className="h-4 w-4" />
              Integracoes
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-slate-900">
              <Eye className="h-4 w-4" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-2 data-[state=active]:bg-slate-900">
              <Globe className="h-4 w-4" />
              Publicar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="m-0 min-h-0 flex-1">
          <div className="flex h-full min-h-0">
            <FormBlockPalette onAddBlock={addBlock} />
            <main className="min-w-0 flex-1">
              <ReactFlowProvider>
                <FormVisualCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNodeId}
                  onChange={handleCanvasChange}
                  onDropBlock={addBlock}
                  onSelectNode={setSelectedNodeId}
                />
              </ReactFlowProvider>
            </main>
            <FormPropertiesPanel
              node={selectedNode}
              onUpdate={updateNode}
              onDelete={deleteSelectedNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="m-0 min-h-0 flex-1 overflow-y-auto bg-background p-6 text-foreground">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
            <section className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Configuracoes do formulario</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descricao</label>
                <Textarea
                  value={form.description || ''}
                  onChange={(event) => setForm(prev => ({ ...prev, description: event.target.value }))}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm(prev => ({ ...prev, type: event.target.value }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="form">Formulario</option>
                    <option value="survey">Pesquisa</option>
                    <option value="quiz">Quiz</option>
                    <option value="questionnaire">Questionario</option>
                    <option value="diagnostic">Diagnostico</option>
                    <option value="intake">Intake</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="closed">Fechado</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.theme?.progressBar || false}
                    onChange={(event) => setForm(prev => ({
                      ...prev,
                      theme: { ...(prev.theme || {}), progressBar: event.target.checked },
                    }))}
                  />
                  Mostrar barra de progresso
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.settings?.allowMultipleResponses || false}
                    onChange={(event) => setForm(prev => ({
                      ...prev,
                      settings: { ...(prev.settings || {}), allowMultipleResponses: event.target.checked },
                    }))}
                  />
                  Permitir multiplas respostas
                </label>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="mt-4 max-h-[520px] overflow-y-auto rounded-md border bg-background p-4">
                <FormPreview form={form} fields={fields} />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="m-0 min-h-0 flex-1 overflow-y-auto bg-background p-6 text-foreground">
          <div className="mx-auto max-w-3xl">
            <FormIntegrationPanel form={form} onUpdate={setForm} />
          </div>
        </TabsContent>

        <TabsContent value="results" className="m-0 min-h-0 flex-1 overflow-y-auto bg-background p-6 text-foreground">
          <div className="mx-auto max-w-4xl rounded-lg border bg-card p-5">
            <ResultsBuilder
              results={form.results || []}
              onUpdate={(results) => setForm(prev => ({ ...prev, results }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="publish" className="m-0 min-h-0 flex-1 overflow-y-auto bg-background p-6 text-foreground">
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Publicacao</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure o status publico e salve para disponibilizar o formulario.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.sharing?.public || false}
                    onChange={(event) => setForm(prev => ({
                      ...prev,
                      sharing: { ...(prev.sharing || {}), public: event.target.checked },
                    }))}
                  />
                  Link publico ativo
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.sharing?.allowEmbed || false}
                    onChange={(event) => setForm(prev => ({
                      ...prev,
                      sharing: { ...(prev.sharing || {}), allowEmbed: event.target.checked },
                    }))}
                  />
                  Permitir embed
                </label>
              </div>
              <div className="mt-5 flex gap-2">
                <Button type="button" onClick={() => handleSave(true)} disabled={isSaving} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Salvar e publicar
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsSimulatorOpen(true)} className="gap-2">
                  <Play className="h-4 w-4" />
                  Testar antes
                </Button>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      <FormVisualSimulator
        open={isSimulatorOpen}
        onOpenChange={setIsSimulatorOpen}
        form={form}
        nodes={nodes}
      />
    </div>
  );
}
