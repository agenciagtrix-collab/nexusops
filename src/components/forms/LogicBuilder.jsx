import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

const OPERATORS = ['equals', 'not_equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'is_checked'];
const ACTIONS = ['show', 'hide', 'skip', 'require', 'calculate'];

export default function LogicBuilder({ conditions, fields, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  const handleAdd = () => {
    const newCondition = {
      id: `cond-${Date.now()}`,
      trigger_field_id: fields[0]?.id || '',
      operator: 'equals',
      value: '',
      action: 'show',
      target_field_id: fields[1]?.id || '',
    };
    onUpdate([...(conditions || []), newCondition]);
  };

  const handleUpdate = (id, changes) => {
    onUpdate(
      (conditions || []).map((c) =>
        c.id === id ? { ...c, ...changes } : c
      )
    );
  };

  const handleRemove = (id) => {
    onUpdate((conditions || []).filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleAdd} variant="outline" size="sm" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Adicionar Regra
      </Button>

      {(conditions || []).map((condition) => (
        <Card key={condition.id} className="p-3">
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={condition.trigger_field_id}
                onValueChange={(value) => handleUpdate(condition.id, { trigger_field_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Campo" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(value) => handleUpdate(condition.id, { operator: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operador" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Valor"
                value={condition.value}
                onChange={(e) => handleUpdate(condition.id, { value: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={condition.action}
                onValueChange={(value) => handleUpdate(condition.id, { action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {['show', 'hide', 'require'].includes(condition.action) && (
                <Select
                  value={condition.target_field_id}
                  onValueChange={(value) => handleUpdate(condition.id, { target_field_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campo Alvo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <button
              onClick={() => handleRemove(condition.id)}
              className="text-destructive text-xs hover:underline"
            >
              Remover
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}