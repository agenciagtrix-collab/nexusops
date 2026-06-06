import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Copy, Eye, Settings } from 'lucide-react';
import FormFieldEditor from './FormFieldEditor';
import FormPreview from './FormPreview';

const QUICK_FIELDS = [
  { type: 'short_text', label: 'Texto Curto', icon: '✏️' },
  { type: 'long_text', label: 'Texto Longo', icon: '📝' },
  { type: 'email', label: 'Email', icon: '✉️' },
  { type: 'number', label: 'Número', icon: '🔢' },
  { type: 'single_choice', label: 'Seleção Única', icon: '◯' },
  { type: 'multiple_choice', label: 'Múltipla Escolha', icon: '◻' },
  { type: 'nps', label: 'NPS', icon: '📊' },
  { type: 'date', label: 'Data', icon: '📅' },
];

export default function FormBuilder({ form, onUpdate }) {
  const [fields, setFields] = useState(form.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [activeTab, setActiveTab] = useState('edit');

  const handleAddField = (type) => {
    const newField = {
      id: `field-${Date.now()}`,
      label: 'Nova Pergunta',
      type,
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    onUpdate({ fields: [...fields, newField] });
  };

  const handleRemoveField = (id) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    onUpdate({ fields: updated });
    setSelectedFieldId(null);
  };

  const handleUpdateField = (id, changes) => {
    const updated = fields.map((f) =>
      f.id === id ? { ...f, ...changes } : f
    );
    setFields(updated);
    onUpdate({ fields: updated });
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    const reordered = items.map((f, idx) => ({ ...f, order: idx }));
    setFields(reordered);
    onUpdate({ fields: reordered });
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Left Panel - Field List */}
      <div className="col-span-1 border-r pr-4 overflow-y-auto space-y-3">
        <div className="sticky top-0 bg-background py-2">
          <h3 className="font-semibold text-sm mb-3">Campos</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_FIELDS.map((f) => (
              <button
                key={f.type}
                onClick={() => handleAddField(f.type)}
                className="p-2 border rounded-lg hover:bg-accent text-left text-xs"
              >
                <span className="mr-1">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 border rounded-lg cursor-move transition-colors ${
                          selectedFieldId === field.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card hover:bg-accent'
                        } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        <p className="font-medium text-sm truncate">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.type}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveField(field.id);
                          }}
                          className="text-destructive hover:underline text-xs mt-1"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Middle Panel - Field Editor */}
      <div className="col-span-1 border-r pr-4 overflow-y-auto">
        {selectedField ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pergunta</label>
              <Input
                value={selectedField.label}
                onChange={(e) =>
                  handleUpdateField(selectedFieldId, { label: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <FormFieldEditor
              field={selectedField}
              onUpdate={(changes) => handleUpdateField(selectedFieldId, changes)}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Selecione um campo ou crie um novo
          </div>
        )}
      </div>

      {/* Right Panel - Preview */}
      <div className="col-span-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="preview">Pré-visualizar</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={form.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ícone</label>
                <Input
                  placeholder="😊"
                  maxLength="2"
                  value={form.icon}
                  onChange={(e) => onUpdate({ icon: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2 mt-1">
                  {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ color })}
                      className="w-8 h-8 rounded border-2"
                      style={{
                        backgroundColor: color,
                        borderColor: form.color === color ? '#000' : '#ccc',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Layout</label>
                <select
                  value={form.theme?.layout || 'single'}
                  onChange={(e) =>
                    onUpdate({ theme: { ...form.theme, layout: e.target.value } })
                  }
                  className="w-full p-2 border rounded-lg bg-card mt-1"
                >
                  <option value="single">Uma pergunta por página</option>
                  <option value="multi">Múltiplas perguntas</option>
                  <option value="progressive">Progressivo</option>
                </select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <FormPreview form={form} fields={fields} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}