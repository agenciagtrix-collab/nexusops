import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function FormAICreator() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('form');

  const examples = [
    {
      title: 'Briefing para Agência de Marketing',
      description: 'Crie um briefing detalhado para captar requisitos de projetos de marketing',
      prompt: 'Crie um formulário de briefing para agência de marketing com perguntas sobre objetivos, público-alvo, orçamento, timeline, referências e entregáveis esperados.',
    },
    {
      title: 'Avaliação de Performance',
      description: 'Avalie a performance de colaboradores com lógica e pontuação',
      prompt: 'Crie um formulário de avaliação de performance com critérios de análise, escala de pontuação, resultados e plano de desenvolvimento personalizado.',
    },
    {
      title: 'Pesquisa de Satisfação NPS',
      description: 'Meça a satisfação e lealdade de clientes',
      prompt: 'Crie uma pesquisa NPS com perguntas sobre satisfação, motivos, sugestões de melhoria e segmentação por produto/serviço.',
    },
    {
      title: 'Diagnóstico de Saúde Mental',
      description: 'Crie um diagnóstico com lógica condicional e resultados personalizados',
      prompt: 'Crie um questionário de saúde mental com lógica condicional que resulte em diagnósticos personalizados como estresse, ansiedade, depressão ou bem-estar.',
    },
  ];

  const handleGenerateFromExample = async (prompt) => {
    setDescription(prompt);
    await generateForm(prompt);
  };

  const generateForm = async (prompt) => {
    setLoading(true);
    try {
      // Aqui você integraria com a IA para gerar o formulário
      // Por enquanto, vamos navegar para o builder com um exemplo
      const formData = {
        title: 'Novo Formulário',
        description: prompt,
        type: selectedType,
        status: 'draft',
        fields: [
          {
            label: 'Pergunta 1',
            type: 'short_text',
            required: true,
          },
          {
            label: 'Pergunta 2',
            type: 'long_text',
            required: false,
          },
        ],
      };

      // Salvar e navegar
      const created = await base44.entities.Form.create(formData);
      navigate(`/forms/${created.id}/edit`);
    } catch (error) {
      console.error('Erro ao gerar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Sparkles className="w-6 h-6" />
          <span className="text-lg font-semibold">IA Criadora de Formulários</span>
        </div>
        <h1 className="text-4xl font-bold">Descreva seu formulário</h1>
        <p className="text-lg text-muted-foreground">
          Use inteligência artificial para gerar formulários, pesquisas e quizzes em segundos
        </p>
      </div>

      {/* Main Input */}
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
            <label className="text-sm font-medium">Descreva seu formulário</label>
            <Textarea
              placeholder="Ex: Crie um formulário de briefing para agência de marketing com perguntas sobre objetivos, público-alvo, orçamento, timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            onClick={() => generateForm(description)}
            disabled={!description.trim() || loading}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Examples */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Exemplos</h2>
        <div className="grid gap-3">
          {examples.map((example, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base">{example.title}</CardTitle>
                    <CardDescription className="mt-1">{example.description}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleGenerateFromExample(example.prompt)}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Seja específico sobre o objetivo do seu formulário</p>
          <p>• Mencione o público-alvo e contexto de uso</p>
          <p>• Indique se precisa de lógica condicional ou pontuação</p>
          <p>• Descreva os resultados esperados</p>
        </CardContent>
      </Card>
    </div>
  );
}