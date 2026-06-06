import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data, old_data, changed_fields } = body;

    const base44 = createClientFromRequest(req);

    if (!data) return Response.json({ ok: true });

    const notifications = [];
    const taskTitle = data.title || 'Tarefa';

    // Task assigned on create
    if (event?.type === 'create' && data.assignee_ids?.length > 0) {
      for (const userId of data.assignee_ids) {
        notifications.push({
          user_id: userId,
          type: 'task_assigned',
          title: 'Nova tarefa atribuída',
          message: `Você foi atribuído à tarefa "${taskTitle}"`,
          entity_type: 'task',
          entity_id: event.entity_id,
          project_id: data.project_id,
          link: `/projects/${data.project_id}`,
          read: false,
        });
      }
    }

    // New assignees on update
    if (event?.type === 'update' && changed_fields?.includes('assignee_ids')) {
      const oldIds = old_data?.assignee_ids || [];
      const newIds = data.assignee_ids || [];
      const addedIds = newIds.filter(id => !oldIds.includes(id));
      for (const userId of addedIds) {
        notifications.push({
          user_id: userId,
          type: 'task_assigned',
          title: 'Nova tarefa atribuída',
          message: `Você foi atribuído à tarefa "${taskTitle}"`,
          entity_type: 'task',
          entity_id: event.entity_id,
          project_id: data.project_id,
          link: `/projects/${data.project_id}`,
          read: false,
        });
      }
    }

    // Status changed for assignees
    if (event?.type === 'update' && changed_fields?.includes('status') && data.assignee_ids?.length > 0) {
      for (const userId of data.assignee_ids) {
        notifications.push({
          user_id: userId,
          type: 'status_changed',
          title: 'Status de tarefa alterado',
          message: `A tarefa "${taskTitle}" mudou para "${data.status}"`,
          entity_type: 'task',
          entity_id: event.entity_id,
          project_id: data.project_id,
          link: `/projects/${data.project_id}`,
          read: false,
        });
      }
    }

    if (notifications.length > 0) {
      await Promise.all(notifications.map(n => base44.asServiceRole.entities.Notification.create(n)));
    }

    return Response.json({ ok: true, created: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});