import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import FormFieldRenderer from '@/components/forms/FormFieldRenderer';
import { blockToField, getNextBlockId, getStartBlock, isInputBlock } from '@/lib/form-flow';

const FORM_UNAVAILABLE_COPY = {
  draft: {
    title: 'Formulario nao publicado',
    message: 'Este formulario ainda esta em rascunho e nao aceita respostas publicas.',
  },
  paused: {
    title: 'Formulario pausado',
    message: 'Este formulario esta temporariamente pausado.',
  },
  closed: {
    title: 'Formulario encerrado',
    message: 'Este formulario foi encerrado e nao aceita novas respostas.',
  },
  private: {
    title: 'Link indisponivel',
    message: 'O compartilhamento publico deste formulario esta desativado.',
  },
  login: {
    title: 'Acesso restrito',
    message: 'Este formulario exige login para ser respondido.',
  },
  limit: {
    title: 'Limite de respostas atingido',
    message: 'Este formulario ja recebeu o numero maximo de respostas permitido.',
  },
};

function UnavailableForm({ form, reason }) {
  const color = form?.color || '#7c3aed';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: `${color}10` }}>
      <Card className="max-w-xl w-full">
        <CardContent className="pt-12 text-center space-y-5">
          <div className="flex justify-center">
            <AlertCircle className="w-14 h-14 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{reason.title}</h2>
            <p className="text-muted-foreground mt-2">{reason.message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FormShare() {
  const { id } = useParams();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [resultPage, setResultPage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState(null);

  const { data: form, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['formFields', id],
    queryFn: () => base44.entities.FormField.filter({ form_id: id }, '-order'),
    enabled: !!id,
  });

  const responseLimit = Number(form?.settings?.responseLimit || 0);
  const hasResponseLimit = !!form?.settings?.limitResponses && responseLimit > 0;
  const { data: existingResponses = [], isLoading: isLoadingResponses, refetch: refetchResponses } = useQuery({
    queryKey: ['formResponseCount', id],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: id }),
    enabled: !!id && hasResponseLimit,
  });
  const submittedResponseCount = useMemo(
    () => existingResponses.filter(response => response.status === 'submitted').length,
    [existingResponses]
  );
  const responseLimitReached = hasResponseLimit && submittedResponseCount >= responseLimit;
  const unavailableReason = useMemo(() => {
    if (!form) return null;
    if (form.status !== 'active') {
      return FORM_UNAVAILABLE_COPY[form.status] || FORM_UNAVAILABLE_COPY.draft;
    }
    if (!form.sharing?.public) return FORM_UNAVAILABLE_COPY.private;
    if (form.settings?.requireLogin) return FORM_UNAVAILABLE_COPY.login;
    if (responseLimitReached) return FORM_UNAVAILABLE_COPY.limit;
    return null;
  }, [form, responseLimitReached]);

  const visualBlocks = useMemo(() => form?.visual_flow?.blocks || [], [form]);
  const visualEdges = useMemo(() => form?.visual_flow?.edges || [], [form]);
  const hasVisualFlow = visualBlocks.some(isInputBlock);
  const visualInputBlocks = useMemo(() => visualBlocks.filter(isInputBlock), [visualBlocks]);
  const currentVisualBlock = useMemo(() => {
    if (!hasVisualFlow) return null;
    const start = currentBlockId
      ? visualBlocks.find(block => block.id === currentBlockId)
      : getStartBlock(visualBlocks, visualEdges, responses);
    return start || visualInputBlocks[0] || null;
  }, [currentBlockId, hasVisualFlow, responses, visualBlocks, visualEdges, visualInputBlocks]);
  const currentVisualField = currentVisualBlock && isInputBlock(currentVisualBlock)
    ? blockToField(currentVisualBlock, id, visualInputBlocks.findIndex(block => block.id === currentVisualBlock.id))
    : null;

  useEffect(() => {
    if (hasVisualFlow && !currentBlockId) {
      setCurrentBlockId(getStartBlock(visualBlocks, visualEdges, responses)?.id || null);
    }
  }, [currentBlockId, hasVisualFlow, responses, visualBlocks, visualEdges]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.entities.FormResponse.create(data);
      
      // Trigger automation if configured
      if (form?.automation_ids?.length) {
        await base44.functions.invoke('processFormResponse', {
          formId: id,
          responseId: response.id,
          responses: data.responses,
        });
      }
      
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleFieldChange = (fieldId, value) => {
    setResponses({ ...responses, [fieldId]: value });
  };

  const getVisibleFields = () => {
    return fields.filter(field => {
      if (!field.conditional) return true;
      
      // Check conditions for this field
      if (form?.logic?.length) {
        const conditions = form.logic.filter(c => c.target_field_id === field.id);
        return conditions.every(cond => evaluateCondition(cond, responses));
      }
      return true;
    });
  };

  const evaluateCondition = (condition, responses) => {
    const fieldValue = responses[condition.trigger_field_id];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      case 'is_checked':
        return fieldValue === true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (unavailableReason) {
      alert(unavailableReason.message);
      return;
    }

    if (hasResponseLimit) {
      const { data: latestResponses = existingResponses } = await refetchResponses();
      const latestSubmittedCount = latestResponses.filter(response => response.status === 'submitted').length;

      if (latestSubmittedCount >= responseLimit) {
        alert(FORM_UNAVAILABLE_COPY.limit.message);
        return;
      }
    }

    const visibleFields = hasVisualFlow
      ? visualInputBlocks
        .filter(block => responses[block.id] !== undefined)
        .map((block, index) => blockToField(block, id, index))
      : getVisibleFields();
    const requiredFields = visibleFields.filter(f => f.required);
    
    const allFilled = requiredFields.every(f => responses[f.id] !== undefined && responses[f.id] !== '');
    if (!allFilled) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const scoreSum = Object.entries(responses).reduce((sum, [fieldId, value]) => {
      const field = visibleFields.find(f => f.id === fieldId) || fields.find(f => f.id === fieldId);
      if (field?.type === 'nps' || field?.type === 'rating') {
        return sum + Number(value);
      }
      return sum;
    }, 0);

    const formResponses = {
      form_id: id,
      responses,
      score: scoreSum > 0 ? scoreSum : undefined,
      status: 'submitted',
      completionTime: Math.round((Date.now() - startTime) / 1000),
    };

    submitMutation.mutate(formResponses);
  };

  const startTime = React.useRef(Date.now()).current;

  const resolveNextVisualBlock = (block) => {
    let nextId = getNextBlockId(block.id, visualEdges, responses);
    const visited = new Set([block.id]);

    while (nextId && !visited.has(nextId)) {
      visited.add(nextId);
      const nextBlock = visualBlocks.find(item => item.id === nextId);
      if (!nextBlock) return null;
      if (isInputBlock(nextBlock) || nextBlock.category === 'result') return nextBlock;
      nextId = getNextBlockId(nextBlock.id, visualEdges, responses);
    }

    return null;
  };

  const handleVisualNext = () => {
    if (!currentVisualBlock) return;

    if (currentVisualField?.required) {
      const value = responses[currentVisualField.id];
      const empty = Array.isArray(value) ? value.length === 0 : value === undefined || value === '';
      if (empty) {
        alert('Por favor, preencha o campo obrigatorio');
        return;
      }
    }

    const nextBlock = resolveNextVisualBlock(currentVisualBlock);
    if (nextBlock?.category === 'result') {
      setResultPage({
        title: nextBlock.label || 'Obrigado',
        description: nextBlock.description || 'Suas respostas foram enviadas com sucesso.',
        content: nextBlock.content || {},
        actions: nextBlock.actions || [],
      });
      handleSubmit();
      return;
    }

    if (nextBlock) {
      setCurrentBlockId(nextBlock.id);
    } else {
      handleSubmit();
    }
  };

  const handleVisualPrev = () => {
    if (!currentVisualBlock) return;
    let incoming = visualEdges.find(edge => edge.target === currentVisualBlock.id);
    const visited = new Set([currentVisualBlock.id]);

    while (incoming && !visited.has(incoming.source)) {
      visited.add(incoming.source);
      const previousBlock = visualBlocks.find(block => block.id === incoming.source);
      if (isInputBlock(previousBlock)) {
        setCurrentBlockId(previousBlock.id);
        return;
      }
      incoming = visualEdges.find(edge => edge.target === incoming.source);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < pageBreaks.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  if (isLoading || isLoadingResponses) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!form) {
    return <div className="flex items-center justify-center min-h-screen">Formulário não encontrado</div>;
  }

  if (unavailableReason) {
    return <UnavailableForm form={form} reason={unavailableReason} />;
  }

  if (submitted && resultPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.color + '10' }}>
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{resultPage.title}</h2>
              <p className="text-muted-foreground mt-2">{resultPage.description}</p>
            </div>
            {resultPage.content?.image && <img src={resultPage.content.image} alt="Result" className="w-full rounded-lg" />}
            {resultPage.actions?.map((action, idx) => (
              <Button key={idx} onClick={() => window.location.href = action.target} className="w-full">
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.color + '10' }}>
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-12 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Resposta enviada</h2>
              <p className="text-muted-foreground mt-2">Obrigado por preencher o formulario.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasVisualFlow) {
    const currentIndex = currentVisualBlock ? visualInputBlocks.findIndex(block => block.id === currentVisualBlock.id) : 0;
    const canGoBack = currentVisualBlock && visualEdges.some(edge => {
      if (edge.target !== currentVisualBlock.id) return false;
      return isInputBlock(visualBlocks.find(block => block.id === edge.source));
    });
    const progress = visualInputBlocks.length
      ? Math.max(((Math.max(currentIndex, 0) + 1) / visualInputBlocks.length) * 100, 8)
      : 100;

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.color + '10' }}>
        <Card className="max-w-2xl w-full">
          <CardHeader style={{ borderBottomColor: form.color, borderBottomWidth: 3 }}>
            <CardTitle className="text-3xl">{form.title}</CardTitle>
            {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
            {form.theme?.progressBar && (
              <div className="mt-4 bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {currentVisualField ? (
              <FormFieldRenderer
                field={currentVisualField}
                value={responses[currentVisualField.id]}
                onChange={(value) => handleFieldChange(currentVisualField.id, value)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Este formulario visual ainda nao possui perguntas.
              </div>
            )}

            <div className="flex gap-3 justify-between pt-4">
              <Button
                onClick={handleVisualPrev}
                variant="outline"
                disabled={!canGoBack || submitMutation.isPending}
              >
                Anterior
              </Button>
              <Button onClick={handleVisualNext} disabled={!currentVisualField || submitMutation.isPending} className="gap-2">
                {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {resolveNextVisualBlock(currentVisualBlock || {}) ? 'Proximo' : 'Enviar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageBreaks = fields.filter((_, i) => i === 0 || fields[i - 1].pageBreak);
  const startIdx = pageBreaks[currentPageIndex] || 0;
  const endIdx = pageBreaks[currentPageIndex + 1] || fields.length;
  const currentFields = getVisibleFields().slice(startIdx, endIdx);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.color + '10' }}>
      <Card className="max-w-2xl w-full">
        <CardHeader style={{ borderBottomColor: form.color, borderBottomWidth: 3 }}>
          <CardTitle className="text-3xl">{form.title}</CardTitle>
          {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
          {form.theme?.progressBar && (
            <div className="mt-4 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${((currentPageIndex + 1) / pageBreaks.length) * 100}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {currentFields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={responses[field.id]}
              onChange={(value) => handleFieldChange(field.id, value)}
            />
          ))}

          <div className="flex gap-3 justify-between pt-4">
            <Button
              onClick={handlePrev}
              variant="outline"
              disabled={currentPageIndex === 0 || submitMutation.isPending}
            >
              Anterior
            </Button>
            {currentPageIndex < pageBreaks.length - 1 ? (
              <Button onClick={handleNext} disabled={submitMutation.isPending}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="gap-2">
                {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
