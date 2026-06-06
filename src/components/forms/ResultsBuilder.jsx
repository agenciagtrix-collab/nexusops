import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function ResultsBuilder({ results, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  const handleAdd = () => {
    const newResult = {
      id: `result-${Date.now()}`,
      title: 'Novo Resultado',
      description: '',
      type: 'default',
      content: { title: '', subtitle: '', text: '' },
      actions: [],
      order: (results || []).length,
    };
    onUpdate([...(results || []), newResult]);
  };

  const handleUpdate = (id, changes) => {
    onUpdate(
      (results || []).map((r) =>
        r.id === id ? { ...r, ...changes } : r
      )
    );
  };

  const handleRemove = (id) => {
    onUpdate((results || []).filter((r) => r.id !== id));
  };

  const editingResult = (results || []).find((r) => r.id === editingId);

  return (
    <div className="space-y-4">
      <Button onClick={handleAdd} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Adicionar Página de Resultado
      </Button>

      <div className="grid gap-3">
        {(results || []).map((result) => (
          <Card key={result.id} className="p-4">
            {editingId === result.id ? (
              <div className="space-y-3">
                <Input
                  value={result.title}
                  onChange={(e) => handleUpdate(result.id, { title: e.target.value })}
                  placeholder="Título do resultado"
                />
                <Textarea
                  value={result.description}
                  onChange={(e) => handleUpdate(result.id, { description: e.target.value })}
                  placeholder="Descrição"
                  rows={2}
                />
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={result.type}
                    onChange={(e) => handleUpdate(result.id, { type: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-card mt-1 text-sm"
                  >
                    <option value="default">Padrão</option>
                    <option value="score_based">Baseado em Pontuação</option>
                    <option value="logic_based">Baseado em Lógica</option>
                  </select>
                </div>

                {result.type === 'score_based' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Pontuação Mínima"
                      defaultValue={result.condition?.scoreMin}
                      onChange={(e) =>
                        handleUpdate(result.id, {
                          condition: {
                            ...result.condition,
                            scoreMin: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Pontuação Máxima"
                      defaultValue={result.condition?.scoreMax}
                      onChange={(e) =>
                        handleUpdate(result.id, {
                          condition: {
                            ...result.condition,
                            scoreMax: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Pronto
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(result.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{result.title}</h4>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">
                    {result.type}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(result.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {(!results || results.length === 0) && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma página de resultado criada
        </div>
      )}
    </div>
  );
}