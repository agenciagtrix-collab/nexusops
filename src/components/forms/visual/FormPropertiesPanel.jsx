import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FIELD_TYPES = [
  ['short_text', 'Texto curto'],
  ['long_text', 'Texto longo'],
  ['email', 'E-mail'],
  ['phone', 'Telefone'],
  ['number', 'Numero'],
  ['date', 'Data'],
  ['time', 'Hora'],
  ['datetime', 'Data e hora'],
  ['currency', 'Moeda'],
  ['file', 'Arquivo'],
  ['image', 'Imagem'],
  ['signature', 'Assinatura'],
  ['single_choice', 'Escolha unica'],
  ['multiple_choice', 'Multipla escolha'],
  ['dropdown', 'Dropdown'],
  ['scale', 'Escala'],
  ['nps', 'NPS'],
  ['rating', 'Avaliacao'],
  ['matrix', 'Matriz'],
];

const OPTION_TYPES = ['single_choice', 'multiple_choice', 'dropdown', 'matrix'];
const QUESTION_TYPES = FIELD_TYPES.map(([type]) => type);

function FieldLabel({ children }) {
  return <label className="text-xs font-medium text-slate-300">{children}</label>;
}

export default function FormPropertiesPanel({ node, onUpdate, onDelete, onClose }) {
  if (!node) {
    return (
      <aside className="flex h-full w-96 shrink-0 items-center justify-center border-l border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-500">
        Selecione um bloco para editar suas propriedades.
      </aside>
    );
  }

  const isQuestion = QUESTION_TYPES.includes(node.type);
  const data = node.data || {};

  const updateData = (updates) => {
    onUpdate({
      ...node,
      label: updates.label ?? node.label,
      type: updates.type ?? node.type,
      data: {
        ...data,
        ...updates,
      },
    });
  };

  const addOption = () => {
    updateData({
      options: [
        ...(data.options || []),
        { id: `opt-${Date.now()}`, label: 'Nova opcao', value: '' },
      ],
    });
  };

  const updateOption = (index, updates) => {
    const options = [...(data.options || [])];
    options[index] = { ...options[index], ...updates };
    updateData({ options });
  };

  const removeOption = (index) => {
    updateData({
      options: (data.options || []).filter((_, itemIndex) => itemIndex !== index),
    });
  };

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <div className="text-xs text-slate-500">Bloco selecionado</div>
          <div className="text-sm font-semibold">{node.label}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-100">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="config" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-2 bg-slate-900">
          <TabsTrigger value="config">Configuracao</TabsTrigger>
          <TabsTrigger value="advanced">Avancado</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="config" className="mt-0 space-y-4">
            <div className="space-y-2">
              <FieldLabel>Nome do bloco</FieldLabel>
              <Input
                value={node.label || ''}
                onChange={(event) => updateData({ label: event.target.value })}
                className="border-slate-800 bg-slate-900 text-slate-100"
              />
            </div>

            {isQuestion && (
              <>
                <div className="space-y-2">
                  <FieldLabel>Texto da pergunta</FieldLabel>
                  <Textarea
                    value={data.question || data.label || node.label || ''}
                    onChange={(event) => updateData({ question: event.target.value, label: event.target.value })}
                    rows={3}
                    className="border-slate-800 bg-slate-900 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Descricao opcional</FieldLabel>
                  <Textarea
                    value={data.helpText || ''}
                    onChange={(event) => updateData({ helpText: event.target.value })}
                    rows={3}
                    className="border-slate-800 bg-slate-900 text-slate-100"
                    placeholder="Explique melhor a pergunta..."
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Tipo de resposta</FieldLabel>
                  <select
                    value={node.type}
                    onChange={(event) => updateData({ type: event.target.value })}
                    className="h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100"
                  >
                    {FIELD_TYPES.map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </div>

                {OPTION_TYPES.includes(node.type) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel>Opcoes</FieldLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(data.options || []).map((option, index) => (
                        <div key={option.id || index} className="flex items-center gap-2">
                          <Input
                            value={option.label || ''}
                            onChange={(event) => updateOption(index, {
                              label: event.target.value,
                              value: option.value || event.target.value.toLowerCase().replace(/\s+/g, '_'),
                            })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="text-slate-500 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={data.required || false}
                      onChange={(event) => updateData({ required: event.target.checked })}
                    />
                    Obrigatoria
                  </label>
                  <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={data.pageBreak || false}
                      onChange={(event) => updateData({ pageBreak: event.target.checked })}
                    />
                    Nova pagina
                  </label>
                </div>
              </>
            )}

            {!isQuestion && node.type !== 'start' && (
              <div className="space-y-2">
                <FieldLabel>Descricao</FieldLabel>
                <Textarea
                  value={data.description || ''}
                  onChange={(event) => updateData({ description: event.target.value })}
                  rows={4}
                  className="border-slate-800 bg-slate-900 text-slate-100"
                  placeholder="Configure a funcao deste bloco..."
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 space-y-4">
            {isQuestion ? (
              <>
                <div className="space-y-2">
                  <FieldLabel>Placeholder</FieldLabel>
                  <Input
                    value={data.placeholder || ''}
                    onChange={(event) => updateData({ placeholder: event.target.value })}
                    className="border-slate-800 bg-slate-900 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Nome da variavel</FieldLabel>
                  <Input
                    value={data.variableName || ''}
                    onChange={(event) => updateData({ variableName: event.target.value })}
                    placeholder="ex: objetivo_principal"
                    className="border-slate-800 bg-slate-900 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <FieldLabel>Minimo</FieldLabel>
                    <Input
                      type="number"
                      value={data.validation?.minValue ?? data.validation?.minLength ?? ''}
                      onChange={(event) => updateData({
                        validation: {
                          ...(data.validation || {}),
                          [node.type === 'number' ? 'minValue' : 'minLength']: event.target.value ? Number(event.target.value) : undefined,
                        },
                      })}
                      className="border-slate-800 bg-slate-900 text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Maximo</FieldLabel>
                    <Input
                      type="number"
                      value={data.validation?.maxValue ?? data.validation?.maxLength ?? ''}
                      onChange={(event) => updateData({
                        validation: {
                          ...(data.validation || {}),
                          [node.type === 'number' ? 'maxValue' : 'maxLength']: event.target.value ? Number(event.target.value) : undefined,
                        },
                      })}
                      className="border-slate-800 bg-slate-900 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Regex / padrao</FieldLabel>
                  <Input
                    value={data.validation?.pattern || ''}
                    onChange={(event) => updateData({
                      validation: {
                        ...(data.validation || {}),
                        pattern: event.target.value,
                      },
                    })}
                    className="border-slate-800 bg-slate-900 text-slate-100"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
                Configuracoes avancadas para este bloco podem ser conectadas nas proximas fases: condicoes, automacoes e mapeamento de dados.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {node.type !== 'start' && (
        <div className="border-t border-slate-800 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            className="w-full border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Excluir bloco
          </Button>
        </div>
      )}
    </aside>
  );
}
