import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Copy } from 'lucide-react';

const FIELD_TYPES = {
  short_text: 'Texto Curto',
  long_text: 'Texto Longo',
  email: 'E-mail',
  number: 'Número',
  date: 'Data',
  time: 'Hora',
  datetime: 'Data e Hora',
  phone: 'Telefone',
  url: 'URL',
  currency: 'Moeda',
  file: 'Arquivo',
  image: 'Imagem',
  video: 'Vídeo',
  signature: 'Assinatura',
  checkbox: 'Checkbox',
  single_choice: 'Seleção Única',
  multiple_choice: 'Múltipla Escolha',
  dropdown: 'Dropdown',
  scale: 'Escala',
  nps: 'NPS',
  rating: 'Avaliação por Estrelas',
  matrix: 'Matriz',
};

export default function FormFieldEditorV2({ field, onUpdate }) {
  const [showOptions, setShowOptions] = useState(false);

  const needsOptions = ['single_choice', 'multiple_choice', 'dropdown', 'matrix'].includes(field.type);

  const addOption = () => {
    const newOptions = [...(field.options || [])];
    newOptions.push({
      id: `opt-${Date.now()}`,
      label: '',
      value: '',
      points: 0,
    });
    onUpdate({ options: newOptions });
  };

  const removeOption = (idx) => {
    const newOptions = field.options?.filter((_, i) => i !== idx) || [];
    onUpdate({ options: newOptions });
  };

  const updateOption = (idx, key, val) => {
    const newOptions = [...(field.options || [])];
    newOptions[idx][key] = val;
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tipo de Campo</Label>
          <select
            value={field.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="w-full mt-1 p-2 border rounded-lg bg-card text-sm"
          >
            {Object.entries(FIELD_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            placeholder="Ex: Digite seu nome"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Texto de Ajuda</Label>
        <Input
          placeholder="Dica para o respondente"
          value={field.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          className="text-xs"
        />
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 rounded border"
          />
          <span className="text-xs">Campo Obrigatório</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.conditional || false}
            onChange={(e) => onUpdate({ conditional: e.target.checked })}
            className="w-4 h-4 rounded border"
          />
          <span className="text-xs">Condicional</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.pageBreak || false}
            onChange={(e) => onUpdate({ pageBreak: e.target.checked })}
            className="w-4 h-4 rounded border"
          />
          <span className="text-xs">Quebra de Página</span>
        </label>
      </div>

      {field.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Mínimo</Label>
            <Input
              type="number"
              value={field.validation?.minValue || ''}
              onChange={(e) => onUpdate({
                validation: {
                  ...field.validation,
                  minValue: e.target.value ? parseInt(e.target.value) : null,
                },
              })}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Máximo</Label>
            <Input
              type="number"
              value={field.validation?.maxValue || ''}
              onChange={(e) => onUpdate({
                validation: {
                  ...field.validation,
                  maxValue: e.target.value ? parseInt(e.target.value) : null,
                },
              })}
              className="text-xs"
            />
          </div>
        </div>
      )}

      {field.type === 'short_text' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Comprimento Mín.</Label>
            <Input
              type="number"
              value={field.validation?.minLength || ''}
              onChange={(e) => onUpdate({
                validation: {
                  ...field.validation,
                  minLength: e.target.value ? parseInt(e.target.value) : null,
                },
              })}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Comprimento Máx.</Label>
            <Input
              type="number"
              value={field.validation?.maxLength || ''}
              onChange={(e) => onUpdate({
                validation: {
                  ...field.validation,
                  maxLength: e.target.value ? parseInt(e.target.value) : null,
                },
              })}
              className="text-xs"
            />
          </div>
        </div>
      )}

      {needsOptions && (
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs font-semibold">Opções</Label>
            <Button
              onClick={addOption}
              size="sm"
              variant="outline"
              className="h-7 gap-1"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <Card key={option.id} className="p-2">
                <CardContent className="p-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Rótulo"
                      value={option.label}
                      onChange={(e) => updateOption(idx, 'label', e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Valor"
                      value={option.value}
                      onChange={(e) => updateOption(idx, 'value', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  {field.type === 'quiz' && (
                    <Input
                      type="number"
                      placeholder="Pontos"
                      value={option.points || 0}
                      onChange={(e) => updateOption(idx, 'points', parseInt(e.target.value))}
                      className="text-xs"
                    />
                  )}
                  <Button
                    onClick={() => removeOption(idx)}
                    size="sm"
                    variant="ghost"
                    className="w-full h-7 text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remover
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}