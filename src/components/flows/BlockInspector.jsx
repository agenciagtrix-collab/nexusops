import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Copy, Settings } from 'lucide-react';

export default function BlockInspector({ node, onUpdate, onDelete }) {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card text-muted-foreground">
        <p>Selecione um bloco para configurar</p>
      </div>
    );
  }

  const fieldConfigs = {
    start: ['description'],
    text: ['placeholder', 'required'],
    question: ['placeholder', 'required'],
    email: ['placeholder', 'required'],
    phone: ['placeholder', 'required'],
    number: ['placeholder', 'required', 'min', 'max'],
    date: ['placeholder', 'required'],
    file: ['required'],
    image: ['required'],
    signature: ['required'],
    single_choice: ['options', 'required'],
    multiple_choice: ['options', 'required'],
    dropdown: ['options', 'required'],
    nps: ['question', 'required'],
    rating: ['question', 'required'],
    condition: ['field', 'operator', 'value', 'trueLabel', 'falseLabel'],
    split: ['description'],
    filter: ['description'],
    validation: ['rule', 'message'],
    wait: ['duration'],
    loop: ['iterations'],
    ai_ask: ['agent', 'prompt'],
    ai_analyze: ['prompt'],
    ai_classify: ['categories'],
    ai_diagnose: ['prompt'],
    ai_summarize: ['prompt'],
    ai_report: ['prompt'],
    ai_decide: ['prompt'],
    ai_suggest: ['prompt'],
    create_client: ['mapping'],
    create_project: ['mapping'],
    create_task: ['mapping'],
    create_process: ['mapping'],
    create_contract: ['mapping'],
    create_document: ['mapping'],
    create_portal: ['mapping'],
    update_status: ['statusValue'],
    add_comment: ['comment'],
    add_tag: ['tag'],
    trigger_automation: ['automationId'],
    send_email: ['to', 'subject', 'body'],
    send_whatsapp: ['phone', 'message'],
    send_sms: ['phone', 'message'],
    send_notification: ['title', 'message'],
    show_message: ['message'],
    show_result: ['message'],
  };

  const currentConfig = fieldConfigs[node.type] || [];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/50 border-l border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg">{node.label}</h3>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{node.type}</p>
          </div>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <Input
          value={node.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Nome do bloco"
          className="text-sm font-medium"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border">
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
          <TabsTrigger value="output">Saída</TabsTrigger>
        </TabsList>

        {/* Config Tab */}
        <TabsContent value="config" className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentConfig.includes('placeholder') && (
            <div>
              <label className="text-xs font-medium block mb-2">Placeholder</label>
              <Input
                value={node.data?.placeholder || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, placeholder: e.target.value } })}
                placeholder="Ex: Digite seu nome"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('question') && (
            <div>
              <label className="text-xs font-medium block mb-2">Pergunta</label>
              <Textarea
                value={node.data?.question || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, question: e.target.value } })}
                placeholder="Sua pergunta"
                rows={3}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('options') && (
            <div>
              <label className="text-xs font-medium block mb-2">Opções</label>
              <Textarea
                value={node.data?.options?.join('\n') || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, options: e.target.value.split('\n').filter(o => o) } })}
                placeholder="Uma opção por linha"
                rows={4}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('required') && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={node.data?.required || false}
                  onChange={(e) => onUpdate({ data: { ...node.data, required: e.target.checked } })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="font-medium">Campo obrigatório</span>
              </label>
            </div>
          )}

          {currentConfig.includes('subject') && (
            <div>
              <label className="text-xs font-medium block mb-2">Assunto</label>
              <Input
                value={node.data?.subject || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, subject: e.target.value } })}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('body') && (
            <div>
              <label className="text-xs font-medium block mb-2">Corpo</label>
              <Textarea
                value={node.data?.body || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, body: e.target.value } })}
                rows={4}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('description') && (
            <div>
              <label className="text-xs font-medium block mb-2">Descrição</label>
              <Textarea
                value={node.data?.description || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, description: e.target.value } })}
                rows={3}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('field') && (
            <div>
              <label className="text-xs font-medium block mb-2">Campo</label>
              <Input
                value={node.data?.field || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, field: e.target.value } })}
                placeholder="Nome da variável"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('operator') && (
            <div>
              <label className="text-xs font-medium block mb-2">Operador</label>
              <select
                value={node.data?.operator || 'equals'}
                onChange={(e) => onUpdate({ data: { ...node.data, operator: e.target.value } })}
                className="w-full p-2 border rounded-lg text-sm bg-card"
              >
                <option value="equals">Igual a</option>
                <option value="not_equals">Não igual</option>
                <option value="contains">Contém</option>
                <option value="gt">Maior que</option>
                <option value="lt">Menor que</option>
                <option value="gte">Maior ou igual</option>
                <option value="lte">Menor ou igual</option>
              </select>
            </div>
          )}

          {currentConfig.includes('value') && (
            <div>
              <label className="text-xs font-medium block mb-2">Valor</label>
              <Input
                value={node.data?.value || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, value: e.target.value } })}
                placeholder="Comparar com..."
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('trueLabel') && (
            <div>
              <label className="text-xs font-medium block mb-2">Rótulo Verdadeiro</label>
              <Input
                value={node.data?.trueLabel || 'Sim'}
                onChange={(e) => onUpdate({ data: { ...node.data, trueLabel: e.target.value } })}
                placeholder="Sim"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('falseLabel') && (
            <div>
              <label className="text-xs font-medium block mb-2">Rótulo Falso</label>
              <Input
                value={node.data?.falseLabel || 'Não'}
                onChange={(e) => onUpdate({ data: { ...node.data, falseLabel: e.target.value } })}
                placeholder="Não"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('agent') && (
            <div>
              <label className="text-xs font-medium block mb-2">Agente IA</label>
              <Input
                value={node.data?.agent || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, agent: e.target.value } })}
                placeholder="Nome do agente"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('prompt') && (
            <div>
              <label className="text-xs font-medium block mb-2">Prompt</label>
              <Textarea
                value={node.data?.prompt || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, prompt: e.target.value } })}
                placeholder="Instrução para IA"
                rows={4}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('duration') && (
            <div>
              <label className="text-xs font-medium block mb-2">Duração (segundos)</label>
              <Input
                type="number"
                value={node.data?.duration || 0}
                onChange={(e) => onUpdate({ data: { ...node.data, duration: parseInt(e.target.value) } })}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('statusValue') && (
            <div>
              <label className="text-xs font-medium block mb-2">Novo Status</label>
              <Input
                value={node.data?.statusValue || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, statusValue: e.target.value } })}
                placeholder="Ex: completed"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('message') && (
            <div>
              <label className="text-xs font-medium block mb-2">Mensagem</label>
              <Textarea
                value={node.data?.message || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, message: e.target.value } })}
                rows={3}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('title') && (
            <div>
              <label className="text-xs font-medium block mb-2">Título</label>
              <Input
                value={node.data?.title || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, title: e.target.value } })}
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('to') && (
            <div>
              <label className="text-xs font-medium block mb-2">Para</label>
              <Input
                value={node.data?.to || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, to: e.target.value } })}
                placeholder="Email ou variável"
                className="text-sm"
              />
            </div>
          )}

          {currentConfig.includes('phone') && (
            <div>
              <label className="text-xs font-medium block mb-2">Telefone</label>
              <Input
                value={node.data?.phone || ''}
                onChange={(e) => onUpdate({ data: { ...node.data, phone: e.target.value } })}
                placeholder="Número ou variável"
                className="text-sm"
              />
            </div>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-2">Variável de Saída</label>
            <Input
              value={node.data?.variableName || ''}
              onChange={(e) => onUpdate({ data: { ...node.data, variableName: e.target.value } })}
              placeholder="ex: resposta_principal"
              className="text-sm font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={node.data?.logResponse || false}
              onChange={(e) => onUpdate({ data: { ...node.data, logResponse: e.target.checked } })}
              className="w-4 h-4 rounded"
            />
            <span>Registrar resposta</span>
          </label>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output" className="flex-1 overflow-y-auto p-4">
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">Próximos blocos conectados:</p>
            <p className="text-xs">As saídas deste bloco serão mapeadas para os blocos abaixo</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}