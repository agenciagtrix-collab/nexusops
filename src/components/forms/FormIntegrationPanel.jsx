import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FolderKanban, Users, CheckSquare, FileText, Zap, Brain,
} from 'lucide-react';

export default function FormIntegrationPanel({ form, onUpdate }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ao Responder o Formulário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.createProject || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      createProject: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Criar Projeto</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cria um novo projeto automaticamente com base nas respostas
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.createClient || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      createClient: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Criar Cliente</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cria um novo cliente automaticamente
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.createTasks || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      createTasks: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Criar Tarefas</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cria tarefas automaticamente no projeto
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.createDocument || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      createDocument: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Gerar Documento</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gera um documento com as respostas automaticamente
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.triggerAutomation || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      triggerAutomation: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Acionar Automações</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dispara automações e webhooks configurados
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.settings?.triggerAgent || false}
                onCheckedChange={(checked) =>
                  onUpdate({
                    settings: {
                      ...form.settings,
                      triggerAgent: checked,
                    },
                  })
                }
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Análise por IA</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Agentes IA analisam respostas e geram insights
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coleta de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.settings?.captureEmail || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  settings: {
                    ...form.settings,
                    captureEmail: checked,
                  },
                })
              }
            />
            <span className="text-sm">Capturar E-mail</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.settings?.captureIdentification || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  settings: {
                    ...form.settings,
                    captureIdentification: checked,
                  },
                })
              }
            />
            <span className="text-sm">Capturar Identificação</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.settings?.requireLogin || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  settings: {
                    ...form.settings,
                    requireLogin: checked,
                  },
                })
              }
            />
            <span className="text-sm">Exigir Login</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.settings?.allowMultipleResponses || false}
              onCheckedChange={(checked) =>
                onUpdate({
                  settings: {
                    ...form.settings,
                    allowMultipleResponses: checked,
                  },
                })
              }
            />
            <span className="text-sm">Permitir Múltiplas Respostas por Usuário</span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}