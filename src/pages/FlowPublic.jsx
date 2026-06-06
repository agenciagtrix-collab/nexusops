import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function FlowPublic() {
  const { id } = useParams();
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: publish } = useQuery({
    queryKey: ['flow-publish', id],
    queryFn: () => base44.entities.FlowPublish.filter({ id }),
    enabled: !!id,
  });

  const { data: flow } = useQuery({
    queryKey: ['flow', publish?.[0]?.flow_id],
    queryFn: () => base44.entities.Flow.filter({ id: publish[0].flow_id }),
    enabled: !!publish?.[0]?.flow_id,
  });

  const createResponse = useMutation({
    mutationFn: (data) => base44.entities.FlowResponse.create(data),
    onSuccess: () => {
      toast.success('Respostas salvas!');
    },
  });

  useEffect(() => {
    if (flow?.[0]) {
      setLoading(false);
    }
  }, [flow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !flow?.[0]) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-2">Fluxo não encontrado</h1>
          <p className="text-muted-foreground">Este fluxo não está disponível ou expirou.</p>
        </Card>
      </div>
    );
  }

  const flowData = flow[0];
  const nodes = flowData.nodes || [];
  const currentNode = nodes[currentNodeIndex];
  const progress = ((currentNodeIndex + 1) / nodes.length) * 100;

  const handleNext = () => {
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    } else {
      // Submeter respostas
      createResponse.mutate({
        flow_id: flowData.id,
        flow_publish_id: publish[0].id,
        responses,
        status: 'completed',
        completion_time: 0,
      });
    }
  };

  const handlePrevious = () => {
    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    }
  };

  const handleResponseChange = (nodeId, value) => {
    setResponses({
      ...responses,
      [nodeId]: value,
    });
  };

  const isLastNode = currentNodeIndex === nodes.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{flowData.name}</h1>
          {flowData.description && (
            <p className="text-muted-foreground">{flowData.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Etapa {currentNodeIndex + 1} de {nodes.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <Card className="p-8 mb-8">
          {currentNode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentNode.label}</h2>
                {currentNode.data?.description && (
                  <p className="text-muted-foreground">{currentNode.data.description}</p>
                )}
              </div>

              {/* Input based on node type */}
              {currentNode.type === 'text_input' && (
                <Input
                  placeholder={currentNode.data?.placeholder || 'Digite sua resposta...'}
                  value={responses[currentNode.id] || ''}
                  onChange={(e) => handleResponseChange(currentNode.id, e.target.value)}
                  className="h-10"
                />
              )}

              {currentNode.type === 'text_long' && (
                <Textarea
                  placeholder={currentNode.data?.placeholder || 'Digite sua resposta...'}
                  value={responses[currentNode.id] || ''}
                  onChange={(e) => handleResponseChange(currentNode.id, e.target.value)}
                  rows={4}
                />
              )}

              {currentNode.type === 'single_choice' && (
                <div className="space-y-2">
                  {currentNode.data?.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleResponseChange(currentNode.id, option.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        responses[currentNode.id] === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {currentNode.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {currentNode.data?.options?.map((option) => {
                    const selected = (responses[currentNode.id] || []).includes(option.value);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          const current = responses[currentNode.id] || [];
                          if (selected) {
                            handleResponseChange(
                              currentNode.id,
                              current.filter(v => v !== option.value)
                            );
                          } else {
                            handleResponseChange(currentNode.id, [...current, option.value]);
                          }
                        }}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="rounded"
                        />
                        <div className="font-medium">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentNodeIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleNext}
              disabled={createResponse.isPending}
              className="gap-2"
            >
              {isLastNode ? (
                <>
                  <Check className="w-4 h-4" />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}