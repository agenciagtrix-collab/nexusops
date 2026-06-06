import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, label, client_name, client_email, expires_at, visibility_settings } = body;

    if (!project_id) {
      return Response.json({ error: 'project_id é obrigatório' }, { status: 400 });
    }

    // Generate secure random token (48 hex chars)
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

    const defaultSettings = {
      show_progress: true,
      show_tasks: true,
      show_assignees: false,
      show_due_dates: true,
      show_files: false,
      show_timeline: true,
      show_next_steps: true,
      show_dashboard: true,
    };

    const share = await base44.asServiceRole.entities.ProjectShare.create({
      project_id,
      token,
      label: label || 'Link do Cliente',
      client_name: client_name || '',
      client_email: client_email || '',
      is_active: true,
      expires_at: expires_at || null,
      access_count: 0,
      visibility_settings: { ...defaultSettings, ...(visibility_settings || {}) },
    });

    return Response.json({ ok: true, share, token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});