import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Eye, Edit, Trash2, Copy, Share2, BarChart3, Search, Filter,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Forms() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list('-updated_date'),
  });

  const filteredForms = forms.filter(f => {
    const matchesSearch = f.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || f.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este formulário?')) {
      await base44.entities.Form.delete(id);
      // Refetch would happen automatically via React Query
    }
  };

  const handleDuplicate = async (form) => {
    const newForm = {
      ...form,
      title: `${form.title} (Cópia)`,
    };
    delete newForm.id;
    delete newForm.created_date;
    delete newForm.updated_date;
    await base44.entities.Form.create(newForm);
  };

  const getTypeLabel = (type) => {
    const labels = {
      form: 'Formulário',
      survey: 'Pesquisa',
      quiz: 'Quiz',
      questionnaire: 'Questionário',
      diagnostic: 'Diagnóstico',
      intake: 'Intake',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-red-100 text-red-700',
    };
    return colors[status] || '';
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formulários Inteligentes</h1>
          <p className="text-muted-foreground mt-1">
            Crie, gerencie e analise formulários, pesquisas e quizzes
          </p>
        </div>
        <Button onClick={() => navigate('/forms/new')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Novo Formulário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Buscar formulários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Tipo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('form')}>
              Formulário
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('survey')}>
              Pesquisa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('quiz')}>
              Quiz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('diagnostic')}>
              Diagnóstico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Nenhum formulário encontrado</p>
              <Button onClick={() => navigate('/forms/new')} variant="outline">
                Criar Primeiro Formulário
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card key={form.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{form.icon || '📋'}</span>
                      <Badge variant="outline">
                        {getTypeLabel(form.type)}
                      </Badge>
                    </div>
                    <CardTitle className="truncate text-lg">{form.title}</CardTitle>
                    {form.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {form.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getStatusColor(form.status)}>
                      {form.status}
                    </Badge>
                    {form.stats?.responses && (
                      <Badge variant="secondary" className="gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {form.stats.responses} respostas
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/forms/${form.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/responses`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Respostas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/analytics`)}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartilhar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(form.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}