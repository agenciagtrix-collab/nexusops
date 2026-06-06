import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const FIELD_TYPES = [
  { value: 'short_text', label: 'Texto Curto' },
  { value: 'long_text', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Data' },
  { value: 'time', label: 'Hora' },
  { value: 'datetime', label: 'Data e Hora' },
  { value: 'currency', label: 'Moeda' },
  { value: 'file', label: 'Arquivo' },
  { value: 'image', label: 'Imagem' },
  { value: 'signature', label: 'Assinatura' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'single_choice', label: 'Seleção Única' },
  { value: 'multiple_choice', label: 'Múltipla Escolha' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'scale', label: 'Escala' },
  { value: 'nps', label: 'NPS' },
  { value: 'rating', label: 'Avaliação por Estrelas' },
  { value: 'matrix', label: 'Matriz' },
];

export default function FormFieldEditor({ field, onUpdate }) {
  const handleAddOption = () => {
    const options = field.options || [];
    onUpdate({
      options: [...options, { id: `opt-${Date.now()}`, label: 'Opção', value: '' }],
    });
  };

  const handleUpdateOption = (index, key, value) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], [key]: value };
    onUpdate({ options });
  };

  const handleRemoveOption = (index) => {
    const options = field.options?.filter((_, i) => i !== index) || [];
    onUpdate({ options });
  };

  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(field.type);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tipo de Campo</Label>
          <Select value={field.type} onValueChange={(value) => onUpdate({ type: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
              Obrigatório
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Texto de Ajuda</Label>
        <Input
          placeholder="Texto adicional para o usuário"
          value={field.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          className="mt-1"
          size="sm"
        />
      </div>

      {field.type === 'short_text' && (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            placeholder="Ex: Digite seu nome..."
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="mt-1"
            size="sm"
          />
        </div>
      )}

      {field.type === 'long_text' && (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Textarea
            placeholder="Ex: Descreva sua experiência..."
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="mt-1"
            rows={2}
          />
        </div>
      )}

      {(field.type === 'number' || field.type === 'currency') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Valor Mínimo</Label>
            <Input
              type="number"
              value={field.validation?.minValue || ''}
              onChange={(e) => onUpdate({
                validation: { ...field.validation, minValue: Number(e.target.value) },
              })}
              className="mt-1"
              size="sm"
            />
          </div>
          <div>
            <Label className="text-xs">Valor Máximo</Label>
            <Input
              type="number"
              value={field.validation?.maxValue || ''}
              onChange={(e) => onUpdate({
                validation: { ...field.validation, maxValue: Number(e.target.value) },
              })}
              className="mt-1"
              size="sm"
            />
          </div>
        </div>
      )}

      {hasOptions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Opções</Label>
            <button
              onClick={handleAddOption}
              className="text-xs text-primary hover:underline"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-1">
            {(field.options || []).map((option, idx) => (
              <div key={option.id} className="flex gap-2 items-center">
                <Input
                  placeholder="Rótulo"
                  value={option.label}
                  onChange={(e) => handleUpdateOption(idx, 'label', e.target.value)}
                  size="sm"
                  className="text-xs"
                />
                <button
                  onClick={() => handleRemoveOption(idx)}
                  className="text-xs text-destructive hover:underline"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}