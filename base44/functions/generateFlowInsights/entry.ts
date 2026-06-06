import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flowId } = await req.json();

    if (!flowId) {
      return Response.json({ error: 'flowId required' }, { status: 400 });
    }

    // Fetch flow and responses
    const [flow] = await base44.entities.Flow.filter({ id: flowId });
    const responses = await base44.entities.FlowResponse.filter({ flow_id: flowId }, '-created_date', 100);

    if (!flow || responses.length === 0) {
      return Response.json({ error: 'Flow or responses not found' }, { status: 404 });
    }

    // Prepare data for analysis
    const stats = {
      totalResponses: responses.length,
      completionRate: ((responses.filter(r => r.status === 'completed').length / responses.length) * 100).toFixed(1),
      abandonmentRate: ((responses.filter(r => r.status === 'in_progress').length / responses.length) * 100).toFixed(1),
      avgTime: responses.filter(r => r.completion_time)
        .reduce((sum, r) => sum + r.completion_time, 0) / Math.max(responses.filter(r => r.completion_time).length, 1),
      commonResults: {},
    };

    responses.forEach(r => {
      if (r.result_title) {
        stats.commonResults[r.result_title] = (stats.commonResults[r.result_title] || 0) + 1;
      }
    });

    const prompt = `Analise os seguintes dados de respostas de um fluxo chamado "${flow.name}":

Total de respostas: ${stats.totalResponses}
Taxa de conclusão: ${stats.completionRate}%
Taxa de abandono: ${stats.abandonmentRate}%
Tempo médio: ${Math.round(stats.avgTime)}s
Resultados mais comuns: ${JSON.stringify(stats.commonResults)}

Forneça:
1. Resumo executivo em 2-3 linhas
2. 3 insights principais sobre o desempenho
3. 2 recomendações de melhoria
4. Padrões comportamentais identificados

Mantenha resposta concisa e acionável.`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
    });

    return Response.json({
      stats,
      insights: insights.content || insights.text || insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});