import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find active share by token
    const shares = await base44.asServiceRole.entities.ProjectShare.filter({ token, is_active: true });
    if (!shares || shares.length === 0) {
      return Response.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }

    const share = shares[0];

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return Response.json({ error: 'Link expirado' }, { status: 403 });
    }

    const settings = {
      show_progress: true,
      show_tasks: true,
      show_assignees: false,
      show_due_dates: true,
      show_files: false,
      show_timeline: true,
      show_next_steps: true,
      show_dashboard: true,
      ...(share.visibility_settings || {}),
    };

    // Load project
    const projects = await base44.asServiceRole.entities.Project.filter({ id: share.project_id });
    if (!projects || projects.length === 0) {
      return Response.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }
    const p = projects[0];

    // Load tasks (strip sensitive fields based on settings)
    const allTasks = await base44.asServiceRole.entities.Task.filter({ project_id: share.project_id });
    const tasks = allTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: settings.show_due_dates ? t.due_date : null,
      start_date: settings.show_due_dates ? t.start_date : null,
      assignee_ids: settings.show_assignees ? (t.assignee_ids || []) : [],
      completed_date: t.completed_date,
      created_date: t.created_date,
      group_id: t.group_id,
    }));

    // Load client (only public info)
    let client = null;
    if (p.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: p.client_id });
      if (clients.length > 0) {
        client = { id: clients[0].id, name: clients[0].name, company: clients[0].company };
      }
    }

    // Load users (only if show_assignees)
    let users = [];
    if (settings.show_assignees) {
      const allUsers = await base44.asServiceRole.entities.User.list('full_name', 100);
      users = allUsers.map(u => ({ id: u.id, full_name: u.full_name }));
    }

    // Load shared documents
    let documents = [];
    if (settings.show_files) {
      const allDocs = await base44.asServiceRole.entities.Document.filter({ project_id: share.project_id });
      documents = allDocs.filter(d => d.shared_with_client);
    }

    // Load public updates sorted desc
    const allUpdates = await base44.asServiceRole.entities.ProjectUpdate.filter({ project_id: share.project_id, is_public: true });
    const updates = allUpdates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Track access count async (don't await)
    base44.asServiceRole.entities.ProjectShare.update(share.id, {
      access_count: (share.access_count || 0) + 1,
      last_accessed: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      ok: true,
      share: {
        id: share.id,
        label: share.label,
        client_name: share.client_name,
        visibility_settings: settings,
      },
      project: {
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        status: p.status,
        priority: p.priority,
        start_date: p.start_date,
        due_date: p.due_date,
        color: p.color,
        progress: p.progress,
        custom_statuses: p.custom_statuses,
        updated_date: p.updated_date,
      },
      tasks,
      client,
      users,
      documents,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});