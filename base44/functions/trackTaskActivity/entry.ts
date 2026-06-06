import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    const base44 = createClientFromRequest(req);

    if (!data && event?.type !== 'delete') return Response.json({ ok: true });

    let description = '';
    let activityType = 'task_updated';
    const taskTitle = data?.title || 'Tarefa';

    if (event?.type === 'create') {
      description = `Tarefa "${taskTitle}" foi criada`;
      activityType = 'task_created';
    } else if (event?.type === 'update' && changed_fields?.length > 0) {
      if (changed_fields.includes('status') && data.status === 'done') {
        description = `Tarefa "${taskTitle}" foi concluída`;
        activityType = 'task_completed';
      } else if (changed_fields.includes('status')) {
        const oldS = old_data?.status || '?';
        description = `Status da tarefa "${taskTitle}" mudou de "${oldS}" para "${data.status}"`;
        activityType = 'status_changed';
      } else if (changed_fields.includes('assignee_ids')) {
        description = `Responsáveis da tarefa "${taskTitle}" foram atualizados`;
        activityType = 'member_added';
      } else {
        const fieldLabels = {
          title: 'Título', description: 'Descrição', priority: 'Prioridade',
          due_date: 'Data de entrega', estimated_hours: 'Horas estimadas',
          logged_hours: 'Horas executadas', tags: 'Tags', checklist: 'Checklist',
        };
        const readableFields = changed_fields.map(f => fieldLabels[f] || f).join(', ');
        description = `Tarefa "${taskTitle}" foi atualizada: ${readableFields}`;
        activityType = 'task_updated';
      }
    } else {
      return Response.json({ ok: true });
    }

    await base44.asServiceRole.entities.Activity.create({
      type: activityType,
      description,
      project_id: data?.project_id,
      task_id: event?.entity_id,
      entity_type: 'task',
      entity_id: event?.entity_id,
      metadata: {
        changed_fields: changed_fields || [],
        old_status: old_data?.status,
        new_status: data?.status,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});