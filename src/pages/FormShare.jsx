import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import FormFieldRenderer from '@/components/forms/FormFieldRenderer';

export default function FormShare() {
  const { id } = useParams();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [resultPage, setResultPage] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['formFields', id],
    queryFn: () => base44.entities.FormField.filter({ form_id: id }, '-order'),
    enabled: !!id,
  });

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
    const visibleFields = getVisibleFields();
    const requiredFields = visibleFields.filter(f => f.required);
    
    const allFilled = requiredFields.every(f => responses[f.id] !== undefined && responses[f.id] !== '');
    if (!allFilled) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const scoreSum = Object.entries(responses).reduce((sum, [fieldId, value]) => {
      const field = fields.find(f => f.id === fieldId);
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!form) {
    return <div className="flex items-center justify-center min-h-screen">Formulário não encontrado</div>;
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