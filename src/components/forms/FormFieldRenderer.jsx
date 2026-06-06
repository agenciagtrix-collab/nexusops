import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const FIELD_LABELS = {
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
  multiple_choice: 'Múltipla Escolha',
  single_choice: 'Seleção Única',
  dropdown: 'Dropdown',
  scale: 'Escala',
  nps: 'NPS',
  rating: 'Avaliação',
  matrix: 'Matriz',
};

export default function FormFieldRenderer({ field, value, onChange }) {
  const renderField = () => {
    const baseProps = {
      required: field.required,
      disabled: false,
    };

    switch (field.type) {
      case 'short_text':
        return (
          <Input
            {...baseProps}
            type="text"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'long_text':
        return (
          <Textarea
            {...baseProps}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        );

      case 'email':
        return (
          <Input
            {...baseProps}
            type="email"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        );

      case 'date':
        return (
          <Input
            {...baseProps}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'time':
        return (
          <Input
            {...baseProps}
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'datetime':
        return (
          <Input
            {...baseProps}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'phone':
        return (
          <Input
            {...baseProps}
            type="tel"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'url':
        return (
          <Input
            {...baseProps}
            type="url"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2 text-muted-foreground">$</span>
            <Input
              {...baseProps}
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="pl-7"
              step="0.01"
            />
          </div>
        );

      case 'file':
        return (
          <Input
            {...baseProps}
            type="file"
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        );

      case 'image':
        return (
          <Input
            {...baseProps}
            type="file"
            accept="image/*"
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
            />
            <label className="text-sm">{field.helpText}</label>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {field.type === 'single_choice' ? (
              <RadioGroup value={value || ''} onValueChange={onChange}>
                {field.options?.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <RadioGroupItem value={option.value} id={option.id} />
                    <Label htmlFor={option.id}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={Array.isArray(value) ? value.includes(option.value) : false}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(value || []), option.value]
                          : (value || []).filter((v) => v !== option.value);
                        onChange(newValue);
                      }}
                    />
                    <Label htmlFor={option.id}>{option.label}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <select
            {...baseProps}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border rounded-lg bg-card"
          >
            <option value="">Selecione uma opção</option>
            {field.options?.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'scale':
      case 'nps':
      case 'rating':
        const maxValue = field.type === 'nps' ? 10 : field.type === 'rating' ? 5 : 10;
        return (
          <div className="flex gap-2 justify-center">
            {Array.from({ length: maxValue }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => onChange(num)}
                className={`px-3 py-2 rounded border transition-colors ${
                  value === num
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted border-border hover:bg-secondary'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        );

      default:
        return <Input {...baseProps} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-2">
      <Label className={field.required ? 'after:content-["*"] after:ml-1 after:text-destructive' : ''}>
        {field.label}
      </Label>
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
      {renderField()}
    </div>
  );
}