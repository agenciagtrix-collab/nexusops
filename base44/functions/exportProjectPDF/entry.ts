import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.2.1';

const statusLabel = {
  not_started: 'Não Iniciado', in_progress: 'Em Andamento',
  on_hold: 'Em Espera', completed: 'Concluído', cancelled: 'Cancelado',
  todo: 'A Fazer', review: 'Em Revisão', done: 'Concluído',
};

const priorityLabel = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica',
};

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id, include_tasks = true, include_stats = true } = body;

    // Fetch project
    const projects = project_id
      ? [await base44.entities.Project.filter({ id: project_id }).then(r => r[0])]
      : await base44.entities.Project.list('name', 200);

    const tasks = include_tasks
      ? (project_id
        ? await base44.entities.Task.filter({ project_id }, '-created_date', 500)
        : await base44.entities.Task.list('-created_date', 500))
      : [];

    const clients = await base44.entities.Client.list('name', 200);
    const users = await base44.asServiceRole.entities.User.list('full_name', 200);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const MARGIN = 15;
    const contentW = W - MARGIN * 2;

    let y = MARGIN;

    const addPage = () => {
      doc.addPage();
      y = MARGIN;
      // header linha
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, 8, W - MARGIN, 8);
    };

    const checkPage = (needed = 10) => {
      if (y + needed > 280) addPage();
    };

    // ── CAPA ──────────────────────────────────────────────
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, W, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Projetos', MARGIN, 28);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, MARGIN, 38);
    doc.text(`Por: ${user.full_name || user.email}`, MARGIN, 45);

    y = 70;
    doc.setTextColor(30, 30, 30);

    // ── RESUMO GERAL ──────────────────────────────────────
    if (include_stats && !project_id) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('Resumo Geral', MARGIN, y); y += 7;
      doc.setTextColor(30, 30, 30);

      const statsData = [
        ['Total de Projetos', String(projects.filter(Boolean).length)],
        ['Em Andamento', String(projects.filter(p => p?.status === 'in_progress').length)],
        ['Concluídos', String(projects.filter(p => p?.status === 'completed').length)],
        ['Total de Tarefas', String(tasks.length)],
        ['Tarefas Concluídas', String(tasks.filter(t => t.status === 'done').length)],
      ];

      const colW = contentW / 5;
      statsData.forEach(([label, val], i) => {
        const x = MARGIN + i * colW;
        doc.setFillColor(245, 245, 255);
        doc.roundedRect(x, y, colW - 3, 18, 2, 2, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text(val, x + (colW - 3) / 2, y + 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(label, x + (colW - 3) / 2, y + 16, { align: 'center' });
      });
      y += 26;
    }

    // ── PROJETOS ──────────────────────────────────────────
    for (const project of projects.filter(Boolean)) {
      checkPage(30);

      // Project header bar
      doc.setFillColor(240, 240, 255);
      doc.roundedRect(MARGIN, y, contentW, 22, 3, 3, 'F');
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(MARGIN, y, 4, 22, 2, 2, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(truncate(project.name, 50), MARGIN + 8, y + 8);

      const client = clients.find(c => c.id === project.client_id);
      const owner = users.find(u => u.id === project.owner_id);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const meta = [
        client ? `Cliente: ${client.name}` : null,
        owner ? `Responsável: ${owner.full_name}` : null,
        project.due_date ? `Prazo: ${new Date(project.due_date).toLocaleDateString('pt-BR')}` : null,
        `Status: ${statusLabel[project.status] || project.status}`,
        `Prioridade: ${priorityLabel[project.priority] || project.priority}`,
      ].filter(Boolean).join('   •   ');
      doc.text(truncate(meta, 100), MARGIN + 8, y + 16);

      y += 26;

      if (project.description) {
        checkPage(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(project.description, contentW - 4);
        doc.text(lines.slice(0, 2), MARGIN + 2, y);
        y += lines.slice(0, 2).length * 5 + 3;
      }

      // Tasks for this project
      if (include_tasks) {
        const projTasks = tasks.filter(t => t.project_id === project.id);
        if (projTasks.length > 0) {
          checkPage(10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          doc.text(`Tarefas (${projTasks.length})`, MARGIN + 2, y); y += 5;

          // Table header
          const cols = [80, 30, 30, 25];
          const headers = ['Título', 'Status', 'Prioridade', 'Prazo'];
          doc.setFillColor(230, 230, 245);
          doc.rect(MARGIN, y, contentW, 7, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 80);
          let cx = MARGIN + 2;
          headers.forEach((h, i) => { doc.text(h, cx, y + 5); cx += cols[i]; });
          y += 8;

          doc.setFont('helvetica', 'normal');
          projTasks.slice(0, 50).forEach((task, idx) => {
            checkPage(7);
            if (idx % 2 === 0) {
              doc.setFillColor(248, 248, 255);
              doc.rect(MARGIN, y - 1, contentW, 7, 'F');
            }
            doc.setTextColor(40, 40, 40);
            doc.setFontSize(8);
            cx = MARGIN + 2;
            doc.text(truncate(task.title, 40), cx, y + 4); cx += cols[0];
            doc.text(truncate(statusLabel[task.status] || task.status || '-', 14), cx, y + 4); cx += cols[1];
            doc.text(truncate(priorityLabel[task.priority] || task.priority || '-', 12), cx, y + 4); cx += cols[2];
            doc.text(task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-', cx, y + 4);
            y += 7;
          });
          if (projTasks.length > 50) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            doc.text(`  + ${projTasks.length - 50} tarefas adicionais`, MARGIN + 2, y + 3);
            y += 6;
          }
        }
      }
      y += 8;
    }

    // ── RODAPÉ na última página ───────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, 288, W - MARGIN, 288);
      doc.text(`Página ${i} de ${totalPages}`, W / 2, 293, { align: 'center' });
      doc.text('Relatório gerado automaticamente', MARGIN, 293);
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-projetos-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});