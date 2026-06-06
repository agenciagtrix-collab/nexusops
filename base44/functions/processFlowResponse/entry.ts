import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'FlowResponse') {
      return Response.json({ ok: true });
    }

    const responseId = event.entity_id;
    const response = await base44.entities.FlowResponse.filter({ id: responseId });
    
    if (!response || response.length === 0) {
      return Response.json({ ok: true });
    }

    const flowResponse = response[0];
    const [flowPublish] = await base44.entities.FlowPublish.filter({ id: flowResponse.flow_publish_id });
    
    if (!flowPublish) {
      return Response.json({ ok: true });
    }

    const [flow] = await base44.entities.Flow.filter({ id: flowResponse.flow_id });

    // Criar Cliente se configurado
    if (flowPublish.linked_clients?.includes('auto_create') || flowPublish.integrations?.createClient) {
      const client = await base44.entities.Client.create({
        name: flowResponse.respondent_name || 'Cliente do Fluxo',
        email: flowResponse.respondent_email,
        phone: flowResponse.respondent_phone,
        tags: [`fluxo_${flow?.name?.toLowerCase()}`],
      });
      
      // Atualizar response com client_id
      await base44.entities.FlowResponse.update(responseId, {
        ...flowResponse,
        client_created_id: client.id,
      });
    }

    // Criar Projeto se configurado
    if (flowPublish.integrations?.createProject) {
      const project = await base44.entities.Project.create({
        name: `${flowResponse.respondent_name} - ${flow?.name}`,
        description: `Projeto gerado automaticamente pela resposta do fluxo "${flow?.name}"`,
        client_id: flowResponse.client_created_id,
        status: 'not_started',
      });

      await base44.entities.FlowResponse.update(responseId, {
        ...flowResponse,
        project_created_id: project.id,
      });
    }

    // Disparar automação se configurada
    if (flowPublish.trigger_automation) {
      try {
        await base44.functions.invoke(flowPublish.trigger_automation, {
          flowResponseId: responseId,
          respondent: {
            name: flowResponse.respondent_name,
            email: flowResponse.respondent_email,
            phone: flowResponse.respondent_phone,
          },
          responses: flowResponse.responses,
        });
      } catch (error) {
        console.error('Error triggering automation:', error);
      }
    }

    return Response.json({ ok: true, processed: true });
  } catch (error) {
    console.error('Error processing flow response:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});