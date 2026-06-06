import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    id: 'briefing',
    name: 'Briefing',
    description: 'Coleta de informações estruturadas para projetos',
    category: 'briefing',
    icon: '📋',
    uses: 145,
  },
  {
    id: 'nps',
    name: 'NPS - Net Promoter Score',
    description: 'Pesquisa de satisfação e lealdade',
    category: 'nps',
    icon: '⭐',
    uses: 389,
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Coletar dados de novos clientes',
    category: 'onboarding',
    icon: '👋',
    uses: 234,
  },
  {
    id: 'lead_capture',
    name: 'Captação de Leads',
    description: 'Formulário para captar leads qualificados',
    category: 'lead_capture',
    icon: '🎯',
    uses: 567,
  },
  {
    id: 'satisfaction',
    name: 'Pesquisa de Satisfação',
    description: 'Avalie a satisfação do cliente',
    category: 'survey',
    icon: '😊',
    uses: 223,
  },
  {
    id: 'diagnostic',
    name: 'Diagnóstico',
    description: 'Crie um diagnóstico com lógica condicional',
    category: 'diagnostic',
    icon: '🔍',
    uses: 156,
  },
  {
    id: 'assessment',
    name: 'Avaliação de Competências',
    description: 'Quiz e avaliação de conhecimento',
    category: 'assessment',
    icon: '📊',
    uses: 178,
  },
  {
    id: 'intake',
    name: 'Formulário de Intake',
    description: 'Coleta de dados para consultas e atendimentos',
    category: 'intake',
    icon: '📝',
    uses: 267,
  },
];

export default function FormTemplates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['formTemplates'],
    queryFn: () => base44.entities.FormTemplate.list(),
  });

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const filtered = selectedCategory === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Todos', count: allTemplates.length },
    { id: 'briefing', name: 'Briefing', count: allTemplates.filter(t => t.category === 'briefing').length },
    { id: 'survey', name: 'Pesquisas', count: allTemplates.filter(t => t.category === 'survey').length },
    { id: 'diagnostic', name: 'Diagnósticos', count: allTemplates.filter(t => t.category === 'diagnostic').length },
    { id: 'assessment', name: 'Avaliações', count: allTemplates.filter(t => t.category === 'assessment').length },
  ];

  const handleUseTemplate = (template) => {
    navigate(`/forms/new?template=${template.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Formulários</h1>
          <p className="text-muted-foreground mt-1">
            Use templates pré-feitos para começar rapidamente
          </p>
        </div>
        <Button onClick={() => navigate('/forms/new')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Do Zero
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
            <Badge variant="secondary" className="ml-2">{cat.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="text-4xl">{template.icon}</div>
                <Badge variant="secondary">{template.category}</Badge>
              </div>
              <CardTitle className="mt-2">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end space-y-3">
              <div className="text-xs text-muted-foreground">
                {template.uses} pessoas utilizaram
              </div>
              <Button
                onClick={() => handleUseTemplate(template)}
                className="w-full"
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum template encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}