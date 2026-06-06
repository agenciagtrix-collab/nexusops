import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'briefing',
    name: 'Briefing de Projeto',
    description: 'Coletar informações detalhadas sobre o projeto',
    emoji: '📋',
    blocks: 15,
    category: 'Marketing',
  },
  {
    id: 'diagnosis',
    name: 'Diagnóstico',
    description: 'Questionário para diagnóstico completo',
    emoji: '🔍',
    blocks: 12,
    category: 'Saúde',
  },
  {
    id: 'lead_capture',
    name: 'Captação de Leads',
    description: 'Formulário rápido para captar leads',
    emoji: '🎯',
    blocks: 8,
    category: 'Vendas',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Guia completo para novos usuários',
    emoji: '👋',
    blocks: 10,
    category: 'Educação',
  },
  {
    id: 'nps',
    name: 'NPS Survey',
    description: 'Pesquisa de satisfação NPS',
    emoji: '📊',
    blocks: 6,
    category: 'Feedback',
  },
  {
    id: 'audit',
    name: 'Auditoria',
    description: 'Checklist de auditoria detalhado',
    emoji: '✅',
    blocks: 20,
    category: 'Qualidade',
  },
];

export default function FlowTemplates() {
  const navigate = useNavigate();

  const handleUseTemplate = async (templateId) => {
    try {
      // Generate flow from template
      const response = await fetch('/api/flows/templates/' + templateId);
      const template = await response.json();
      navigate('/flows/new', { state: { template } });
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Fluxos</h1>
          <p className="text-muted-foreground mt-1">Inicie rápido com modelos prontos</p>
        </div>
        <Button onClick={() => navigate('/flows/new')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Criar do Zero
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">{template.emoji}</span>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {template.blocks} blocos
              </div>
              <Button
                onClick={() => handleUseTemplate(template.id)}
                className="w-full"
              >
                Usar Este Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}