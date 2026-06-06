import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Trash2, Eye, Save, Settings, ChevronUp, ChevronDown, Copy,
} from 'lucide-react';
import FormFieldEditor from '@/components/forms/FormFieldEditor';
import FormPreview from '@/components/forms/FormPreview';

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: 'Novo Formulário',
    description: '',
    type: 'form',
    status: 'draft',
    icon: '📋',
    fields: [],
    theme: { layout: 'single', progressBar: false },
  });
  const [fields, setFields] = useState([]);

  const { data: existingForm } = useQuery({
    queryKey: ['form', id],
    queryFn: () => (id ? base44.entities.Form.get(id) : null),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingForm) {
      setForm(existingForm);
      // Buscar fields relacionados
      if (existingForm.fields?.length) {
        base44.entities.FormField.filter({ form_id: id }).then(setFields);
      }
    }
  }, [existingForm, id]);

  const handleAddField = () => {
    const newField = {
      form_id: id || 'temp',
      label: 'Nova Pergunta',
      type: 'short_text',
      required: false,
      order: fields.length,
    };
    setFields([...fields, { ...newField, id: `temp-${Date.now()}` }]);
  };

  const handleUpdateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    const updated = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((f, i) => { f.order = i; });
    setFields(updated);
  };

  const handleSave = async () => {
    try {
      let formId = id;
      const formData = {
        ...form,
        fields: fields.map((f, i) => ({ ...f, order: i })),
      };

      if (id) {
        await base44.entities.Form.update(id, formData);
      } else {
        const created = await base44.entities.Form.create(formData);
        formId = created.id;
      }

      // Salvar fields
      for (const field of fields) {
        if (field.id?.startsWith('temp')) {
          await base44.entities.FormField.create({
            ...field,
            form_id: formId,
          });
        } else if (field.id) {
          await base44.entities.FormField.update(field.id, field);
        }
      }

      navigate(`/forms/${formId}/edit`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construtor de Formulários</h1>
          <p className="text-muted-foreground mt-1">Crie sua pesquisa arrastando e soltando campos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/forms')} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Construtor</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="text-4xl">{form.icon}</div>
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Título do formulário"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fields Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Perguntas</CardTitle>
              <Button onClick={handleAddField} size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Adicionar Pergunta
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta" para começar.
                </div>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input
                          placeholder="Pergunta"
                          value={field.label}
                          onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                          className="font-medium mb-2"
                        />
                        <FormFieldEditor field={field} onUpdate={(updates) => handleUpdateField(index, updates)} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveField(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveField(index, 'down')}
                        disabled={index === fields.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveField(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-2 p-2 border rounded-lg bg-card"
                  >
                    <option value="form">Formulário</option>
                    <option value="survey">Pesquisa</option>
                    <option value="quiz">Quiz</option>
                    <option value="diagnostic">Diagnóstico</option>
                    <option value="intake">Intake</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full mt-2 p-2 border rounded-lg bg-card"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="closed">Fechado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tema</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Layout</label>
                    <select
                      value={form.theme?.layout}
                      onChange={(e) => setForm({
                        ...form,
                        theme: { ...form.theme, layout: e.target.value },
                      })}
                      className="w-full mt-1 p-2 border rounded-lg bg-card text-sm"
                    >
                      <option value="single">Uma pergunta por página</option>
                      <option value="multi">Múltiplas perguntas</option>
                      <option value="progressive">Progressivo</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <FormPreview form={form} fields={fields} />
        </TabsContent>
      </Tabs>
    </div>
  );
}