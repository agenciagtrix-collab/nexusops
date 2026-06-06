import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    const { formId, responseId, responses } = await req.json();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await base44.asServiceRole.entities.Form.get(formId);
    const response = await base44.asServiceRole.entities.FormResponse.get(responseId);

    // Create project if configured
    if (form?.automation_ids?.length) {
      const automationName = responses.projectName || `Projeto ${form.title}`;
      
      const project = await base44.asServiceRole.entities.Project.create({
        name: automationName,
        description: `Criado a partir do formulário: ${form.title}`,
        status: 'not_started',
        priority: 'medium',
        owner_id: user.id,
      });

      // Create client if email is captured
      if (responses.email) {
        const client = await base44.asServiceRole.entities.Client.create({
          name: responses.name || responses.email,
          email: responses.email,
          status: 'active',
        });

        // Link client to project
        await base44.asServiceRole.entities.Project.update(project.id, {
          client_id: client.id,
        });

        // Link response to project and client
        await base44.asServiceRole.entities.FormResponse.update(responseId, {
          project_id: project.id,
          client_id: client.id,
        });
      } else {
        await base44.asServiceRole.entities.FormResponse.update(responseId, {
          project_id: project.id,
        });
      }

      // Create initial tasks if workflow is defined
      const taskGroups = form.automation_ids ? ['Ações'] : [];
      if (taskGroups.length) {
        await base44.asServiceRole.entities.Task.create({
          title: `Processar resposta de ${form.title}`,
          description: `Resposta ID: ${responseId}`,
          project_id: project.id,
          status: 'todo',
          priority: 'medium',
          assigned_ids: [user.id],
        });
      }
    }

    return Response.json({ success: true, responseId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});