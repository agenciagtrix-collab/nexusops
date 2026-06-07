import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';

function getNextBlockId(blockId, edges) {
  return edges.find(edge => edge.source === blockId)?.target || null;
}

function getStartBlock(blocks, edges) {
  const start = blocks.find(block => block.category === 'start');
  if (start) {
    const first = getNextBlockId(start.id, edges);
    return blocks.find(block => block.id === first) || blocks.find(block => block.category === 'input') || start;
  }
  return blocks.find(block => block.category === 'input') || blocks[0];
}

function renderField(block, value, onChange) {
  if (block.kind === 'long_text') {
    return <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={block.placeholder || 'Digite sua resposta...'} rows={5} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />;
  }

  if (['single_choice', 'multiple_choice', 'dropdown'].includes(block.kind)) {
    if (block.kind === 'dropdown') {
      return (
        <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">Selecione...</option>
          {(block.options || []).map(option => <option key={option.id} value={option.value || option.label}>{option.label}</option>)}
        </select>
      );
    }

    return (
      <div className="space-y-2">
        {(block.options || []).map(option => {
          const optionValue = option.value || option.label;
          const selected = block.kind === 'multiple_choice' ? (value || []).includes(optionValue) : value === optionValue;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (block.kind === 'multiple_choice') {
                  const values = value || [];
                  onChange(selected ? values.filter(item => item !== optionValue) : [...values, optionValue]);
                } else {
                  onChange(optionValue);
                }
              }}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${selected ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (block.kind === 'rating') {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)} className={`text-3xl ${value >= star ? 'text-amber-400' : 'text-muted-foreground'}`}>★</button>
        ))}
      </div>
    );
  }

  if (block.kind === 'nps') {
    return (
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, index) => (
          <button key={index} type="button" onClick={() => onChange(index)} className={`rounded-lg border py-2 text-sm ${value === index ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}>{index}</button>
        ))}
      </div>
    );
  }

  return <Input type={block.kind === 'number' ? 'number' : block.kind === 'date' ? 'date' : block.kind === 'email' ? 'email' : 'text'} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={block.placeholder || 'Digite sua resposta...'} />;
}

export default function FormTestDialog({ open, onOpenChange, form, blocks, edges }) {
  const inputBlocks = useMemo(() => blocks.filter(block => block.category === 'input'), [blocks]);
  const [currentId, setCurrentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  const currentBlock = useMemo(() => {
    if (!open) return null;
    const id = currentId || getStartBlock(blocks, edges)?.id;
    return blocks.find(block => block.id === id) || null;
  }, [blocks, currentId, edges, open]);

  const currentIndex = currentBlock?.category === 'input' ? inputBlocks.findIndex(block => block.id === currentBlock.id) : 0;
  const progress = inputBlocks.length ? Math.max(((currentIndex + 1) / inputBlocks.length) * 100, 8) : 100;

  const reset = () => {
    setCurrentId(getStartBlock(blocks, edges)?.id || null);
    setAnswers({});
    setCompleted(false);
  };

  const handleNext = () => {
    if (!currentBlock) return;
    const nextId = getNextBlockId(currentBlock.id, edges);
    const nextBlock = blocks.find(block => block.id === nextId);
    if (nextBlock && nextBlock.category !== 'result') {
      setCurrentId(nextBlock.id);
    } else {
      setCompleted(true);
    }
  };

  React.useEffect(() => {
    if (open) reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testar formulário</DialogTitle>
        </DialogHeader>

        {completed ? (
          <div className="space-y-6 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Teste concluído</h2>
              <p className="mt-2 text-muted-foreground">{Object.keys(answers).length} resposta(s) simulada(s).</p>
            </div>
            <Button onClick={reset} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> Testar novamente</Button>
          </div>
        ) : currentBlock ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{form.title}</span>
                <span>{currentIndex + 1} de {Math.max(inputBlocks.length, 1)}</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="rounded-2xl border p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">{currentBlock.icon}</div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{currentBlock.typeLabel}</p>
                  <h3 className="mt-1 text-xl font-semibold">{currentBlock.question || currentBlock.label}</h3>
                  {currentBlock.helpText && <p className="mt-2 text-sm text-muted-foreground">{currentBlock.helpText}</p>}
                </div>
              </div>
              {currentBlock.category === 'input' ? renderField(currentBlock, answers[currentBlock.id], (value) => setAnswers(prev => ({ ...prev, [currentBlock.id]: value }))) : (
                <p className="text-sm text-muted-foreground">Bloco visual de {currentBlock.typeLabel}. Clique em próximo para continuar a simulação.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={reset}>Reiniciar</Button>
              <Button onClick={handleNext} className="gap-2">Próximo <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Adicione blocos para testar o formulário.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
