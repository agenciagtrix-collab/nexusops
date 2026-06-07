import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'email',
  'phone',
  'number',
  'date',
  'time',
  'datetime',
  'currency',
  'file',
  'image',
  'signature',
  'single_choice',
  'multiple_choice',
  'dropdown',
  'scale',
  'nps',
  'rating',
  'matrix',
];

function renderQuestion(node, value, onChange) {
  const data = node.data || {};
  const options = data.options || [];

  if (node.type === 'long_text') {
    return (
      <Textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={data.placeholder}
        rows={4}
      />
    );
  }

  if (['email', 'phone', 'number', 'date', 'time', 'datetime', 'currency'].includes(node.type)) {
    const typeMap = {
      email: 'email',
      phone: 'tel',
      number: 'number',
      date: 'date',
      time: 'time',
      datetime: 'datetime-local',
      currency: 'number',
    };
    return (
      <Input
        type={typeMap[node.type]}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={data.placeholder}
      />
    );
  }

  if (node.type === 'single_choice') {
    return (
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.id} className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <input
              type="radio"
              name={node.id}
              checked={value === option.label}
              onChange={() => onChange(option.label)}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (node.type === 'multiple_choice') {
    const values = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.id} className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={values.includes(option.label)}
              onChange={(event) => {
                onChange(event.target.checked
                  ? [...values, option.label]
                  : values.filter(item => item !== option.label));
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (node.type === 'dropdown') {
    return (
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      >
        <option value="">Selecione...</option>
        {options.map(option => (
          <option key={option.id} value={option.label}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (['nps', 'scale', 'rating'].includes(node.type)) {
    const count = node.type === 'nps' ? 11 : 5;
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => onChange(index)}
            className={[
              'h-10 w-10 rounded-md border text-sm font-medium',
              value === index ? 'border-primary bg-primary text-primary-foreground' : 'bg-background',
            ].join(' ')}
          >
            {node.type === 'nps' ? index : index + 1}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Input
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={data.placeholder || 'Digite sua resposta'}
    />
  );
}

export default function FormVisualSimulator({ open, onOpenChange, form, nodes }) {
  const questionNodes = useMemo(() => (
    [...nodes]
      .filter(node => QUESTION_TYPES.includes(node.type))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  ), [nodes]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = questionNodes[step];
  const progress = questionNodes.length ? Math.round(((step + 1) / questionNodes.length) * 100) : 0;

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testar formulario</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{form.title}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {current ? (
            <div className="rounded-lg border p-5">
              <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Pergunta {step + 1} de {questionNodes.length}
              </div>
              <h3 className="mt-2 text-xl font-semibold">
                {current.data?.question || current.label}
                {current.data?.required && <span className="text-destructive"> *</span>}
              </h3>
              {current.data?.helpText && (
                <p className="mt-2 text-sm text-muted-foreground">{current.data.helpText}</p>
              )}
              <div className="mt-5">
                {renderQuestion(current, answers[current.id], value => setAnswers(prev => ({
                  ...prev,
                  [current.id]: value,
                })))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              Adicione perguntas ao canvas para testar o formulario.
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              {step < questionNodes.length - 1 ? (
                <Button type="button" onClick={() => setStep(step + 1)} className="gap-2">
                  Avancar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={() => onOpenChange(false)} className="gap-2">
                  Finalizar
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
