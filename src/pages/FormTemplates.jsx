import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Copy } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'briefing',
    name: 'Briefing para Agência',
    description: 'Formulário de briefing detalhado para captar requisitos',
    icon: '📋',
    category: 'briefing',
  },
  {
    id: 'nps',
    name: 'Pesquisa NPS',
    description: 'Meça a satisfação e lealdade de clientes',
    icon: '📊',
    category: 'nps',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Formulário de integração para novos usuários',
    icon: '👋',
    category: 'onboarding',
  },
  {
    id: 'diagnostic',
    name: 'Diagnóstico',
    description: 'Diagnóstico com lógica e resultados personalizados',
    icon: '🔍',
    category: 'diagnostic',
  },
  {
    id: 'evaluation',
    name: 'Avaliação de Performance',
    description: 'Avalie colaboradores com escala e pontuação',
    icon: '⭐',
    category: 'assessment',
  },
  {
    id: 'survey',
    name: 'Pesquisa Interna',
    description: 'Pesquisa de clima e cultura organizacional',
    icon: '📝',
    category: 'internal_research',
  },
  {
    id: 'lead-capture',
    name: 'Captação de Leads',
    description: 'Formulário para captura de contatos qualificados',
    icon: '📧',
    category: 'lead_capture',
  },
  {
    id: 'intake',
    name: 'Anamnese',
    description: 'Formulário de intake para serviços profissionais',
    icon: '📌',
    category: 'intake',
  },
];

export default function FormTemplates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['formTemplates'],
    queryFn: () => base44.entities.FormTemplate.list(),
    initialData: [],
  });

  const filteredTemplates = TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleUseTemplate = (template) => {
    // Navegar para criador com template
    navigate(`/forms/new?template=${template.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Formulários</h1>
          <p className="text-muted-foreground mt-1">Escolha um template para começar</p>
        </div>
        <Button onClick={() => navigate('/forms/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Do Zero
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl">{template.icon}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="text-base mt-3">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <Button
                onClick={() => handleUseTemplate(template)}
                variant="outline"
                className="w-full"
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum template encontrado</p>
        </div>
      )}
    </div>
  );
}