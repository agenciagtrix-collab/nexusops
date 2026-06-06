import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DynamicPropertiesPanel({ selectedNode, onUpdate, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    config: true,
    advanced: false,
  });

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
        Selecione um bloco para editar
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePropertyChange = (field, value) => {
    onUpdate({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [field]: value
      }
    });
  };

  const blockTypeConfigs = {
    start: {
      basic: ['label'],
      config: [],
      advanced: ['description'],
    },
    text: {
      basic: ['label', 'placeholder'],
      config: ['required'],
      advanced: ['description', 'helpText'],
    },
    question: {
      basic: ['label', 'question'],
      config: ['required', 'placeholder'],
      advanced: ['description', 'helpText', 'validation'],
    },
    email: {
      basic: ['label', 'placeholder'],
      config: ['required'],
      advanced: ['validation', 'helpText'],
    },
    phone: {
      basic: ['label', 'placeholder'],
      config: ['required'],
      advanced: ['validation', 'helpText'],
    },
    number: {
      basic: ['label', 'placeholder'],
      config: ['required', 'min', 'max'],
      advanced: ['validation', 'helpText'],
    },
    date: {
      basic: ['label', 'placeholder'],
      config: ['required'],
      advanced: ['validation', 'helpText'],
    },
    single_choice: {
      basic: ['label', 'question'],
      config: ['required', 'options'],
      advanced: ['description'],
    },
    multiple_choice: {
      basic: ['label', 'question'],
      config: ['required', 'options'],
      advanced: ['description'],
    },
    nps: {
      basic: ['label', 'question'],
      config: ['required'],
      advanced: ['description'],
    },
    condition: {
      basic: ['label', 'field', 'operator', 'value'],
      config: ['trueLabel', 'falseLabel'],
      advanced: [],
    },
    ai_ask: {
      basic: ['label', 'agent', 'prompt'],
      config: [],
      advanced: [],
    },
    create_client: {
      basic: ['label'],
      config: ['mapping'],
      advanced: [],
    },
    create_project: {
      basic: ['label'],
      config: ['mapping'],
      advanced: [],
    },
    send_email: {
      basic: ['label', 'to', 'subject', 'body'],
      config: [],
      advanced: [],
    },
    show_result: {
      basic: ['label', 'message'],
      config: [],
      advanced: [],
    },
    end: {
      basic: ['label'],
      config: [],
      advanced: [],
    },
  };

  const config = blockTypeConfigs[selectedNode.type] || {
    basic: ['label'],
    config: [],
    advanced: [],
  };

  const renderField = (fieldName, section) => {
    const value = selectedNode.data?.[fieldName] ?? '';

    switch (fieldName) {
      case 'label':
      case 'placeholder':
      case 'agent':
      case 'to':
      case 'subject':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium capitalize">
              {fieldName === 'label' ? 'Nome' : fieldName}
            </label>
            <Input
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
              placeholder={`Digite ${fieldName}`}
              className="text-sm"
            />
          </div>
        );

      case 'question':
      case 'prompt':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium capitalize">{fieldName}</label>
            <Textarea
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
              placeholder={`Digite a ${fieldName}`}
              rows={3}
              className="text-sm"
            />
          </div>
        );

      case 'message':
      case 'body':
      case 'description':
      case 'helpText':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium capitalize">
              {fieldName === 'message' ? 'Mensagem' : fieldName}
            </label>
            <Textarea
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
        );

      case 'required':
        return (
          <div key={fieldName} className="space-y-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handlePropertyChange(fieldName, e.target.checked)}
              id={`${selectedNode.id}-required`}
              className="rounded border-border"
            />
            <label htmlFor={`${selectedNode.id}-required`} className="text-xs font-medium cursor-pointer">
              Obrigatório
            </label>
          </div>
        );

      case 'min':
      case 'max':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium uppercase">{fieldName}</label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, parseFloat(e.target.value))}
              placeholder={fieldName}
              className="text-sm"
            />
          </div>
        );

      case 'field':
      case 'operator':
      case 'value':
      case 'trueLabel':
      case 'falseLabel':
        if (fieldName === 'operator') {
          return (
            <div key={fieldName} className="space-y-2">
              <label className="text-xs font-medium">Operador</label>
              <select
                value={value}
                onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
                className="w-full p-2 border rounded-lg text-sm bg-card"
              >
                <option value="equals">Igual a</option>
                <option value="not_equals">Não igual</option>
                <option value="contains">Contém</option>
                <option value="gt">Maior que</option>
                <option value="lt">Menor que</option>
              </select>
            </div>
          );
        }

        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium capitalize">{fieldName}</label>
            <Input
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
              placeholder={`Digite ${fieldName}`}
              className="text-sm"
            />
          </div>
        );

      case 'options':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium">Opções</label>
            <Textarea
              value={Array.isArray(value) ? value.join('\n') : ''}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value.split('\n').filter(o => o.trim()))}
              placeholder="Uma opção por linha"
              rows={3}
              className="text-sm"
            />
          </div>
        );

      case 'validation':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium">Validação</label>
            <select
              value={value}
              onChange={(e) => handlePropertyChange(fieldName, e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-card"
            >
              <option value="">Nenhuma</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="url">URL</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>
        );

      case 'mapping':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="text-xs font-medium">Mapeamento de Campos</label>
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              Configure o mapeamento de campos do fluxo para o bloco de ação
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-full bg-card border-l border-border overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Bloco</div>
          <div className="text-sm font-semibold">{selectedNode.label}</div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Properties */}
      <div className="p-4 space-y-4">
        {/* Basic Section */}
        {config.basic.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors mb-2"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.basic ? '' : '-rotate-90'}`}
              />
              <span className="text-xs font-semibold uppercase text-muted-foreground">Básico</span>
            </button>
            {expandedSections.basic && (
              <div className="space-y-3 pl-2">
                {config.basic.map(field => renderField(field, 'basic'))}
              </div>
            )}
          </div>
        )}

        {/* Config Section */}
        {config.config.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('config')}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors mb-2"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.config ? '' : '-rotate-90'}`}
              />
              <span className="text-xs font-semibold uppercase text-muted-foreground">Configuração</span>
            </button>
            {expandedSections.config && (
              <div className="space-y-3 pl-2">
                {config.config.map(field => renderField(field, 'config'))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Section */}
        {config.advanced.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('advanced')}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors mb-2"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.advanced ? '' : '-rotate-90'}`}
              />
              <span className="text-xs font-semibold uppercase text-muted-foreground">Avançado</span>
            </button>
            {expandedSections.advanced && (
              <div className="space-y-3 pl-2">
                {config.advanced.map(field => renderField(field, 'advanced'))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}