import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { formId, analysisType = 'summary' } = body;

    if (!formId) {
      return Response.json({ error: 'formId is required' }, { status: 400 });
    }

    // Fetch form and responses
    const form = await base44.entities.Form.get(formId);
    const responses = await base44.entities.FormResponse.filter({ form_id: formId });

    if (!responses.length) {
      return Response.json({
        summary: {
          totalResponses: 0,
          message: 'No responses yet',
        },
      });
    }

    // Calculate statistics
    const stats = {
      totalResponses: responses.length,
      submittedResponses: responses.filter(r => r.status === 'submitted').length,
      draftResponses: responses.filter(r => r.status === 'draft').length,
      averageCompletionTime: Math.round(
        responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / responses.length
      ),
      completionRate: Math.round(
        (responses.filter(r => r.status === 'submitted').length / responses.length) * 100
      ),
    };

    // Analyze field responses
    const fieldAnalysis = {};
    const fields = await base44.entities.FormField.filter({ form_id: formId });

    for (const field of fields) {
      const fieldResponses = responses
        .map(r => r.responses?.[field.id])
        .filter(v => v !== undefined && v !== null);

      if (fieldResponses.length === 0) continue;

      fieldAnalysis[field.id] = {
        fieldLabel: field.label,
        fieldType: field.type,
        responsesCount: fieldResponses.length,
        responseRate: Math.round((fieldResponses.length / responses.length) * 100),
      };

      // Type-specific analysis
      if (['single_choice', 'multiple_choice', 'dropdown'].includes(field.type)) {
        const counts = {};
        fieldResponses.forEach(r => {
          const val = Array.isArray(r) ? r.join(',') : r;
          counts[val] = (counts[val] || 0) + 1;
        });
        fieldAnalysis[field.id].distribution = counts;
      } else if (['nps', 'rating', 'scale'].includes(field.type)) {
        fieldAnalysis[field.id].average = (
          fieldResponses.reduce((a, b) => a + parseInt(b), 0) / fieldResponses.length
        ).toFixed(1);
      }
    }

    // Calculate trend
    const recentResponses = responses.filter(
      r => new Date(r.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const olderResponses = responses.length - recentResponses;
    const trend = olderResponses > 0
      ? Math.round(((recentResponses - olderResponses) / olderResponses) * 100)
      : 0;

    return Response.json({
      formId,
      stats,
      fieldAnalysis,
      trend,
      responsesByDay: getResponsesByDay(responses),
      topResults: getTopResults(form, responses),
    });
  } catch (error) {
    console.error('Error analyzing responses:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getResponsesByDay(responses) {
  const days = {};
  responses.forEach(r => {
    const date = new Date(r.created_date).toISOString().split('T')[0];
    days[date] = (days[date] || 0) + 1;
  });
  return days;
}

function getTopResults(form, responses) {
  if (form.type !== 'quiz' && form.type !== 'diagnostic') return null;

  const resultCounts = {};
  responses.forEach(r => {
    if (r.result_id) {
      resultCounts[r.result_id] = (resultCounts[r.result_id] || 0) + 1;
    }
  });

  return Object.entries(resultCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([resultId, count]) => ({
      resultId,
      count,
      percentage: Math.round((count / responses.length) * 100),
    }));
}