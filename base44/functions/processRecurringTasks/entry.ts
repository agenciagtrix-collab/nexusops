import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — run as service role
    const tasks = await base44.asServiceRole.entities.Task.filter({ is_recurring: true });
    const doneTasks = tasks.filter(t => t.status === 'done' && t.due_date && t.recurrence_rule);

    let created = 0;

    for (const task of doneTasks) {
      const rule = (task.recurrence_rule || '').toLowerCase();
      const dueDate = new Date(task.due_date);
      let nextDue;

      if (rule.includes('diár') || rule.includes('diaria') || rule.includes('daily') || rule.includes('todo dia')) {
        nextDue = new Date(dueDate);
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (rule.includes('quinzen')) {
        nextDue = new Date(dueDate);
        nextDue.setDate(nextDue.getDate() + 14);
      } else if (rule.includes('semana') || rule.includes('semanal') || rule.includes('week') || rule.includes('segunda') || rule.includes('toda')) {
        nextDue = new Date(dueDate);
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (rule.includes('mês') || rule.includes('mes') || rule.includes('mensal') || rule.includes('month')) {
        nextDue = new Date(dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (rule.includes('trimest')) {
        nextDue = new Date(dueDate);
        nextDue.setMonth(nextDue.getMonth() + 3);
      } else if (rule.includes('anual') || rule.includes('anualmente') || rule.includes('year')) {
        nextDue = new Date(dueDate);
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      } else {
        continue;
      }

      const nextDueStr = nextDue.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Only create if next due date is not in the future yet (up to today)
      if (nextDueStr > today) continue;

      // Check if already exists
      const existing = await base44.asServiceRole.entities.Task.filter({
        project_id: task.project_id,
        title: task.title,
        due_date: nextDueStr,
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.Task.create({
          title: task.title,
          description: task.description,
          project_id: task.project_id,
          group_id: task.group_id,
          assignee_ids: task.assignee_ids || [],
          status: 'todo',
          priority: task.priority,
          estimated_hours: task.estimated_hours,
          due_date: nextDueStr,
          tags: task.tags || [],
          checklist: (task.checklist || []).map(c => ({ text: c.text, done: false })),
          is_recurring: true,
          recurrence_rule: task.recurrence_rule,
        });
        created++;
      }
    }

    return Response.json({ ok: true, message: `Criadas ${created} tarefas recorrentes.`, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});