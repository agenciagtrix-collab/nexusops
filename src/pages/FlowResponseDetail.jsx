import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FlowResponseDetail() {
  const { onMenuToggle } = useOutletContext();
  const { responseId } = useParams();
  const navigate = useNavigate();

  const { data: response } = useQuery({
    queryKey: ['flow-response', responseId],
    queryFn: () => base44.entities.FlowResponse.filter({ id: responseId }),
  });

  const { data: flow } = useQuery({
    queryKey: ['flow', response?.[0]?.flow_id],
    queryFn: () => base44.entities.Flow.filter({ id: response[0].flow_id }),
    enabled: !!response?.[0]?.flow_id,
  });

  if (!response?.[0]) return <div>Carregando...</div>;

  const r = response[0];
  const f = flow?.[0];

  const completionTime = r.completion_time ? `${Math.round(r.completion_time / 60)}s` : '-';

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Detalhes da Resposta" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{f?.name}</h1>
              <p className="text-muted-foreground mt-1">Resposta recebida em {new Date(r.created_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </div>

          {/* Respondent Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Respondente</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{r.respondent_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{r.respondent_email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{r.respondent_phone || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Response Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Resposta</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-2" variant={r.status === 'completed' ? 'default' : 'secondary'}>
                  {r.status === 'completed' ? 'Concluída' : 'Em Progresso'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Gasto</p>
                <p className="font-medium mt-1">{completionTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origem</p>
                <p className="font-medium mt-1">{r.source || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dispositivo</p>
                <p className="font-medium mt-1">{r.device_type || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {r.responses && Object.entries(r.responses).map(([key, value]) => (
                  <div key={key} className="pb-4 border-b last:border-b-0">
                    <p className="text-sm font-medium text-muted-foreground">{key}</p>
                    <p className="mt-1 text-base">{typeof value === 'object' ? JSON.stringify(value) : value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {r.result_title && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{r.result_title}</p>
                {r.score && <p className="text-muted-foreground mt-2">Pontuação: {r.score}</p>}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(r.project_created_id || r.client_created_id || r.tasks_created?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Ações Realizadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.client_created_id && <p>✓ Cliente criado: {r.client_created_id}</p>}
                {r.project_created_id && <p>✓ Projeto criado: {r.project_created_id}</p>}
                {r.tasks_created?.map(taskId => (
                  <p key={taskId}>✓ Tarefa criada: {taskId}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}