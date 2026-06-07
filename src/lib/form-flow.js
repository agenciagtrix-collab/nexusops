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
