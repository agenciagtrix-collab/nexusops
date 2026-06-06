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
Você é um especialista em construir fluxos e jornadas de usuário.

Com base na descrição a seguir, gere uma estrutura de fluxo visual com blocos conectados.

Descrição do fluxo:
${prompt}

Retorne um JSON com:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "start|input|logic|ai|platform|communication|end",
      "label": "Nome do Bloco",
      "position": { "x": número, "y": número },
      "data": { propriedades relevantes }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "label da conexão opcional"
    }
  ]
}

Gere um fluxo lógico e bem estruturado com pelo menos 5-10 blocos relevantes.
Tipo de fluxo: ${flowType}
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
                position: { type: 'object' },
                data: { type: 'object' },
              },
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
            },
          },
        },
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