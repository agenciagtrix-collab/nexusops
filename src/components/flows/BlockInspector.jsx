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
    text: ['placeholder', 'required'],
    email: ['placeholder', 'required'],
    phone: ['placeholder', 'required'],
    number: ['placeholder', 'required', 'min', 'max'],
    date: ['placeholder', 'required'],
    single_choice: ['options', 'required'],
    multiple_choice: ['options', 'required'],
    nps: ['question', 'required'],
    condition: ['field', 'operator', 'value'],
    split: ['description'],
    ai_ask: ['agent', 'prompt'],
    create_client: ['mapping'],
    create_project: ['mapping'],
    send_email: ['to', 'subject', 'body'],
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