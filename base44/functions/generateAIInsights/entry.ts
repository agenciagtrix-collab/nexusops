import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projects = [], tasks = [] } = body;

    if (projects.length === 0 && tasks.length === 0) {
      return Response.json({ insights: [], suggestions: [] });
    }

    // Prepare summarized data to send to LLM (avoid huge payload)
    const projectSummaries = projects.slice(0, 20).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      due_date: p.due_date,
      start_date: p.start_date,
      progress: p.progress,
      task_count: tasks.filter(t => t.project_id === p.id).length,
      done_count: tasks.filter(t => t.project_id === p.id && t.status === 'done').length,
    }));

    const taskSummaries = tasks.slice(0, 100).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      logged_hours: t.logged_hours,
      has_assignees: (t.assignee_ids?.length || 0) > 0,
      project_id: t.project_id,
      created_date: t.created_date,
      completed_date: t.completed_date,
    }));

    const today = new Date().toISOString().split('T')[0];

    const prompt = `Você é um assistente especialista em gestão de projetos e produtividade. Analise os dados abaixo de uma plataforma de gestão de projetos e gere insights inteligentes em português brasileiro.

Data de hoje: ${today}

PROJETOS (${projectSummaries.length}):
${JSON.stringify(projectSummaries, null, 2)}

TAREFAS (${taskSummaries.length} das mais recentes):
${JSON.stringify(taskSummaries, null, 2)}

Com base nesses dados, gere:

1. "bottlenecks": Identifique gargalos operacionais (tarefas travadas, projetos sem progresso, sobrecarga)
2. "priority_suggestions": Sugira re-priorização de tarefas ou projetos com justificativa
3. "deadline_predictions": Projetos em risco de atraso baseado no ritmo atual
4. "productivity_tips": Dicas práticas e específicas para melhorar a produtividade
5. "summary": Uma análise executiva curta (2-3 frases) sobre o estado geral do portfólio

Seja específico e mencione nomes reais de projetos/tarefas quando relevante.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
              }
            }
          },
          priority_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                action: { type: "string" }
              }
            }
          },
          deadline_predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                project_name: { type: "string" },
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
                description: { type: "string" }
              }
            }
          },
          productivity_tips: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tip: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json({ ok: true, analysis: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});