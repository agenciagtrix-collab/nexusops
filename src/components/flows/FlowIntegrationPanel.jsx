import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FlowIntegrationPanel({ publish, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [createProject, setCreateProject] = useState(publish?.integrations?.createProject || false);
  const [createClient, setCreateClient] = useState(publish?.integrations?.createClient || false);
  const [createTasks, setCreateTasks] = useState(publish?.integrations?.createTasks || false);
  const [automationId, setAutomationId] = useState(publish?.trigger_automation || '');
  const [agentId, setAgentId] = useState(publish?.trigger_agent || '');

  const handleSave = () => {
    onUpdate({
      integrations: {
        createProject,
        createClient,
        createTasks,
      },
      trigger_automation: automationId,
      trigger_agent: agentId,
    });
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Configurar Integrações
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integrações do Fluxo</DialogTitle>
            <DialogDescription>
              Configure o que acontece quando alguém completa o fluxo
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="crm" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crm">CRM</TabsTrigger>
              <TabsTrigger value="automation">Automação</TabsTrigger>
            </TabsList>

            <TabsContent value="crm" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createClient"
                    checked={createClient}
                    onChange={(e) => setCreateClient(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="createClient" className="font-medium cursor-pointer">
                      Criar Cliente Automaticamente
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cria um novo cliente com dados do respondente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createProject"
                    checked={createProject}
                    onChange={(e) => setCreateProject(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="createProject" className="font-medium cursor-pointer">
                      Criar Projeto
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cria um projeto baseado nas respostas do fluxo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createTasks"
                    checked={createTasks}
                    onChange={(e) => setCreateTasks(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="createTasks" className="font-medium cursor-pointer">
                      Criar Tarefas
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cria tarefas automáticas no projeto baseado em respostas
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="automationId">ID da Automação (opcional)</Label>
                <Input
                  id="automationId"
                  placeholder="ID da automação a disparar"
                  value={automationId}
                  onChange={(e) => setAutomationId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dispara uma automação registrada quando fluxo é concluído
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">ID do Agente IA (opcional)</Label>
                <Input
                  id="agentId"
                  placeholder="ID do agente IA a disparar"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ativa um agente IA para processar as respostas
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Integrações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}