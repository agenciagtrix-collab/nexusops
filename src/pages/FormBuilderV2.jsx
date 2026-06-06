import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Trash2, Save, Settings, ChevronUp, ChevronDown, Eye,
} from 'lucide-react';
import FormFieldEditorV2 from '@/components/forms/FormFieldEditorV2';
import FormPreview from '@/components/forms/FormPreview';
import LogicBuilder from '@/components/forms/LogicBuilder';
import ResultsBuilder from '@/components/forms/ResultsBuilder';
import FormIntegrationPanel from '@/components/forms/FormIntegrationPanel';

export default function FormBuilderV2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: 'Novo Formulário',
    description: '',
    type: 'form',
    status: 'draft',
    icon: '📋',
    color: '#6366f1',
    fields: [],
    theme: { layout: 'single', progressBar: false },
    logic: [],
    results: [],
    settings: {},
  });
  const [fields, setFields] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');

  const { data: existingForm } = useQuery({
    queryKey: ['form', id],
    queryFn: () => (id ? base44.entities.Form.get(id) : null),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingForm) {
      setForm(existingForm);
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construtor de Formulários</h1>
          <p className="text-muted-foreground mt-1">Crie formulários, pesquisas e quizzes avançados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/forms')} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Formulário
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="builder">Construtor</TabsTrigger>
          <TabsTrigger value="logic">Lógica</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="integration">Integrações</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Builder */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  maxLength="2"
                  className="text-4xl w-16 text-center border rounded p-1 bg-card"
                />
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-card text-sm"
                  >
                    <option value="form">Formulário</option>
                    <option value="survey">Pesquisa</option>
                    <option value="quiz">Quiz</option>
                    <option value="diagnostic">Diagnóstico</option>
                    <option value="intake">Intake</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-card text-sm"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="closed">Fechado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Cor</label>
                  <div className="flex gap-2 mt-1">
                    {['#6366f1', '#ec4899', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm({ ...form, color })}
                        className="w-8 h-8 rounded border-2"
                        style={{
                          backgroundColor: color,
                          borderColor: form.color === color ? '#000' : '#ccc',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Perguntas ({fields.length})</CardTitle>
              <Button onClick={handleAddField} size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Clique em "Adicionar" para criar sua primeira pergunta.
                </div>
              ) : (
                fields.map((field, index) => (
                  <Card key={field.id} className="border-2 hover:border-primary transition">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Pergunta {index + 1}
                        </span>
                        <div className="flex gap-1">
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

                      <Input
                        placeholder="Sua pergunta aqui"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        className="font-medium mb-4"
                      />

                      <FormFieldEditorV2
                        field={field}
                        onUpdate={(updates) => handleUpdateField(index, updates)}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logic */}
        <TabsContent value="logic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lógica Condicional</CardTitle>
              <p className="text-sm text-muted-foreground">Crie fluxos dinâmicos</p>
            </CardHeader>
            <CardContent>
              <LogicBuilder
                conditions={form.logic}
                fields={fields}
                onUpdate={(logic) => setForm({ ...form, logic })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Páginas de Resultado</CardTitle>
              <p className="text-sm text-muted-foreground">Resultados personalizados por respostas</p>
            </CardHeader>
            <CardContent>
              <ResultsBuilder
                results={form.results}
                onUpdate={(results) => setForm({ ...form, results })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration */}
        <TabsContent value="integration" className="space-y-4">
          <FormIntegrationPanel form={form} onUpdate={setForm} />
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview">
          <FormPreview form={form} fields={fields} />
        </TabsContent>
      </Tabs>
    </div>
  );
}