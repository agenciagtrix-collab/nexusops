import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function FormPreview({ form, fields }) {
  const renderField = (field) => {
    const commonClasses = 'w-full';
    const labelClasses = 'block text-sm font-medium mb-2';
    const helpClasses = 'text-xs text-muted-foreground mt-1';

    switch (field.type) {
      case 'short_text':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <Input
              placeholder={field.placeholder}
              disabled
              className={commonClasses}
            />
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'long_text':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <Textarea
              placeholder={field.placeholder}
              disabled
              rows={3}
              className={commonClasses}
            />
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <Input type="email" disabled className={commonClasses} />
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <Input type="number" disabled className={commonClasses} />
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <Input type="date" disabled className={commonClasses} />
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'single_choice':
        return (
          <div key={field.id} className="space-y-2">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <RadioGroup disabled>
              {(field.options || []).map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <RadioGroupItem value={option.id} id={option.id} disabled />
                  <Label htmlFor={option.id} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={field.id} className="space-y-2">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox id={option.id} disabled />
                  <Label htmlFor={option.id} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <select disabled className="w-full p-2 border rounded-lg bg-card">
              <option>Selecione uma opção</option>
              {(field.options || []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'nps':
        return (
          <div key={field.id} className="space-y-3">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 11 }).map((_, i) => (
                <button
                  key={i}
                  disabled
                  className="w-10 h-10 border rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {i}
                </button>
              ))}
            </div>
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className="space-y-2">
            <label className={labelClasses}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} disabled className="text-2xl cursor-not-allowed">
                  ☆
                </button>
              ))}
            </div>
            {field.helpText && <p className={helpClasses}>{field.helpText}</p>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-1">
            <label className={labelClasses}>{field.label}</label>
            <Input disabled placeholder="Campo" className={commonClasses} />
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">{form.icon}</div>
          <h1 className="text-3xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>

        {form.theme?.progressBar && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>1 de {fields.length}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '0%' }} />
            </div>
          </div>
        )}

        <div className="space-y-6">
          {fields.map((field) => renderField(field))}
        </div>

        {fields.length > 0 && (
          <Button disabled className="w-full">
            Enviar
          </Button>
        )}

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma pergunta adicionada ainda
          </div>
        )}
      </Card>
    </div>
  );
}