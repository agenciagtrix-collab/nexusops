export const VISUAL_INPUT_KINDS = new Set([
  'short_text',
  'long_text',
  'number',
  'date',
  'time',
  'datetime',
  'email',
  'phone',
  'url',
  'currency',
  'file',
  'image',
  'video',
  'signature',
  'checkbox',
  'multiple_choice',
  'single_choice',
  'dropdown',
  'scale',
  'nps',
  'rating',
  'matrix',
  'custom',
]);

export function isInputBlock(block) {
  return block?.category === 'input' || VISUAL_INPUT_KINDS.has(block?.kind);
}

export function blockToField(block, formId = 'visual', order = 0) {
  return {
    id: block.id,
    form_id: formId,
    label: block.question || block.label || `Pergunta ${order + 1}`,
    type: VISUAL_INPUT_KINDS.has(block.kind) ? block.kind : 'short_text',
    required: !!block.required,
    placeholder: block.placeholder || '',
    helpText: block.helpText || '',
    options: block.options || [],
    validation: block.validation || {},
    order,
    conditional: !!block.conditional,
    pageBreak: !!block.pageBreak,
    variableName: block.variableName,
    saveAsVariable: block.saveAsVariable !== false,
  };
}

export function getEdgeConditionLabel(edge) {
  const condition = edge?.condition;
  if (!condition || condition.type === 'always') return edge?.label || '';
  if (condition.type === 'answer_equals') return condition.label || edge?.label || String(condition.value || '');
  if (condition.type === 'answer_contains') return condition.label || edge?.label || `Contem ${condition.value || ''}`;
  return edge?.label || '';
}

export function answerMatchesCondition(answer, condition) {
  if (!condition || condition.type === 'always') return true;

  const expected = String(condition.value ?? '');
  if (!expected) return true;

  if (Array.isArray(answer)) {
    const values = answer.map(value => String(value));
    return condition.type === 'answer_contains'
      ? values.some(value => value.includes(expected))
      : values.includes(expected);
  }

  const current = String(answer ?? '');
  if (condition.type === 'answer_contains') return current.includes(expected);
  return current === expected;
}

export function getNextBlockId(blockId, edges, answers = {}) {
  const outgoing = (edges || []).filter(edge => edge.source === blockId);
  if (!outgoing.length) return null;

  const answer = answers[blockId];
  const conditionalMatch = outgoing.find(edge => edge.condition && edge.condition.type !== 'always' && answerMatchesCondition(answer, edge.condition));
  if (conditionalMatch) return conditionalMatch.target;

  const defaultEdge = outgoing.find(edge => !edge.condition || edge.condition.type === 'always');
  return (defaultEdge || outgoing[0]).target;
}

export function getStartBlock(blocks, edges, answers = {}) {
  const start = (blocks || []).find(block => block.category === 'start');
  if (start) {
    const first = getNextBlockId(start.id, edges, answers);
    return (blocks || []).find(block => block.id === first) || (blocks || []).find(isInputBlock) || start;
  }
  return (blocks || []).find(isInputBlock) || blocks?.[0] || null;
}

export function getReachableInputBlocks(blocks, edges) {
  const inputBlocks = (blocks || []).filter(isInputBlock);
  if (!edges?.length) return inputBlocks;

  const visited = new Set();
  const ordered = [];
  let current = getStartBlock(blocks, edges);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (isInputBlock(current)) ordered.push(current);
    const nextId = getNextBlockId(current.id, edges);
    current = (blocks || []).find(block => block.id === nextId);
  }

  return ordered.length ? ordered : inputBlocks;
}

function addIssue(issues, severity, code, message, targetId = null) {
  issues.push({ severity, code, message, targetId });
}

export function validateVisualFlow(blocks = [], edges = []) {
  const issues = [];
  const blockIds = new Set(blocks.map(block => block.id));
  const inputBlocks = blocks.filter(isInputBlock);
  const startBlocks = blocks.filter(block => block.category === 'start');

  if (!blocks.length) {
    addIssue(issues, 'error', 'empty_flow', 'Adicione blocos antes de publicar.');
    return { issues, errors: issues, warnings: [] };
  }

  if (startBlocks.length === 0) {
    addIssue(issues, 'error', 'missing_start', 'Adicione um bloco de inicio ao fluxo.');
  } else if (startBlocks.length > 1) {
    addIssue(issues, 'error', 'multiple_starts', 'Mantenha apenas um bloco de inicio.');
  }

  if (!inputBlocks.length) {
    addIssue(issues, 'error', 'missing_questions', 'Adicione pelo menos uma pergunta ao formulario.');
  }

  edges.forEach(edge => {
    if (!blockIds.has(edge.source)) {
      addIssue(issues, 'error', 'broken_edge_source', 'Existe uma conexao com origem removida.', edge.id);
    }
    if (!blockIds.has(edge.target)) {
      addIssue(issues, 'error', 'broken_edge_target', 'Existe uma conexao com destino removido.', edge.id);
    }
    if (edge.condition?.type && edge.condition.type !== 'always' && !String(edge.condition.value || '').trim()) {
      addIssue(issues, 'error', 'empty_edge_condition', 'Uma conexao condicional precisa de um valor de resposta.', edge.id);
    }
  });

  inputBlocks.forEach(block => {
    if (!String(block.question || block.label || '').trim()) {
      addIssue(issues, 'error', 'empty_question', 'Uma pergunta esta sem texto.', block.id);
    }
    if (['single_choice', 'multiple_choice', 'dropdown'].includes(block.kind) && !(block.options || []).some(option => String(option.label || '').trim())) {
      addIssue(issues, 'error', 'missing_options', `A pergunta "${block.question || block.label}" precisa de opcoes.`, block.id);
    }
    if (block.saveAsVariable !== false && !String(block.variableName || '').trim()) {
      addIssue(issues, 'warning', 'missing_variable', `A pergunta "${block.question || block.label}" nao tem nome de variavel.`, block.id);
    }
  });

  const variableNames = new Map();
  inputBlocks.forEach(block => {
    if (block.saveAsVariable === false || !block.variableName) return;
    const normalized = String(block.variableName).trim();
    if (variableNames.has(normalized)) {
      addIssue(issues, 'warning', 'duplicate_variable', `A variavel "${normalized}" esta duplicada.`, block.id);
    } else {
      variableNames.set(normalized, block.id);
    }
  });

  const validEdges = edges.filter(edge => blockIds.has(edge.source) && blockIds.has(edge.target));
  const outgoingBySource = validEdges.reduce((acc, edge) => {
    acc.set(edge.source, [...(acc.get(edge.source) || []), edge]);
    return acc;
  }, new Map());

  const start = startBlocks[0];
  if (start && !(outgoingBySource.get(start.id) || []).length) {
    addIssue(issues, 'error', 'start_without_next', 'Conecte o bloco de inicio a uma pergunta.');
  }

  const reachable = new Set();
  const queue = start ? [start.id] : [];
  while (queue.length) {
    const blockId = queue.shift();
    if (reachable.has(blockId)) continue;
    reachable.add(blockId);
    (outgoingBySource.get(blockId) || []).forEach(edge => queue.push(edge.target));
  }

  blocks.forEach(block => {
    if (block.category === 'start') return;
    if (start && !reachable.has(block.id)) {
      addIssue(issues, 'warning', 'unreachable_block', `O bloco "${block.label || block.typeLabel}" nao esta conectado ao fluxo principal.`, block.id);
    }
  });

  outgoingBySource.forEach((outgoing, sourceId) => {
    const source = blocks.find(block => block.id === sourceId);
    const conditionalEdges = outgoing.filter(edge => edge.condition?.type && edge.condition.type !== 'always');
    const defaultEdges = outgoing.filter(edge => !edge.condition || edge.condition.type === 'always');

    if (conditionalEdges.length > 0 && defaultEdges.length === 0) {
      addIssue(
        issues,
        'warning',
        'missing_default_edge',
        `O bloco "${source?.label || source?.typeLabel || sourceId}" tem caminhos condicionais, mas nao tem caminho padrao.`,
        sourceId
      );
    }
  });

  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  return { issues, errors, warnings };
}
