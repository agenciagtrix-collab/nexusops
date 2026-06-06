import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, flowType = 'journey' } = body;

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Call InvokeLLM to generate flow structure
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `
Você é um especialista em construir fluxos inteligentes, jornadas de usuário e automações profissionais.

Com base na descrição a seguir, gere uma estrutura de fluxo visual completo com blocos bem conectados.

Descrição do fluxo:
${prompt}

Retorne um JSON válido com:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "start|text|email|phone|question|single_choice|multiple_choice|nps|condition|split|ai_ask|ai_classify|ai_diagnose|create_client|create_project|send_email|show_result|end",
      "label": "Nome descritivo do bloco",
      "position": { "x": número (múltiplo de 300), "y": número (múltiplo de 150) },
      "data": { 
        "placeholder": "texto auxiliar se for input",
        "question": "pergunta se for relevante",
        "prompt": "instrução de IA se for bloco IA",
        "required": true/false,
        "options": ["opção1", "opção2"] se for choice
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "Sim" ou "Não" se for condição, opcional para outros
    }
  ]
}

Diretrizes:
1. Inicie sempre com um bloco "start"
2. Termine com um bloco "show_result" ou "end"
3. Use condições ("condition") para lógica condicional
4. Integre blocos IA (ai_ask, ai_classify, ai_diagnose) quando apropriado
5. Use blocos de plataforma (create_project, create_client) para ações
6. Use blocos de comunicação (send_email, show_result) para saída
7. Crie fluxo lógico e bem estruturado com 6-12 blocos relevantes
8. Posicione os blocos em grid: x = (índice % 3) * 300, y = Math.floor(índice / 3) * 150

Tipo de fluxo: ${flowType}

Tipos de blocos disponíveis por categoria:
- Entrada: start, text, email, phone, question, single_choice, multiple_choice, nps, number, date, file, image, signature, dropdown, rating
- Lógica: condition, split, filter, validation, wait, loop, end
- IA: ai_ask, ai_analyze, ai_classify, ai_diagnose, ai_summarize, ai_report, ai_decide, ai_suggest
- Plataforma: create_client, create_project, create_task, create_process, create_contract, create_document, update_status, add_tag
- Comunicação: send_email, send_whatsapp, send_sms, send_notification, show_message, show_result
      `,
      response_json_schema: {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                label: { type: 'string' },
                position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
                data: { type: 'object' },
              },
              required: ['id', 'type', 'label', 'position'],
            },
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                source: { type: 'string' },
                target: { type: 'string' },
                label: { type: 'string' },
              },
              required: ['id', 'source', 'target'],
            },
          },
        },
        required: ['nodes', 'edges'],
      },
    });

    // Ensure valid positions
    const nodes = aiResponse.nodes?.map((node, idx) => ({
      ...node,
      position: node.position || { x: (idx % 3) * 300, y: Math.floor(idx / 3) * 150 },
    })) || [];

    const edges = aiResponse.edges || [];

    return Response.json({
      nodes,
      edges,
      startNode: nodes[0]?.id,
    });
  } catch (error) {
    console.error('Error generating flow:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});