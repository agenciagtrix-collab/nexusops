import React, { useState } from 'react';
import React, { useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, FolderKanban,
  Edit, CheckCircle2, AlertTriangle, Clock, Upload, Loader2, ExternalLink, Image, Film, FileSpreadsheet, File
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels = { not_started: 'Não Iniciado', in_progress: 'Em Andamento', on_hold: 'Em Espera', completed: 'Concluído', cancelled: 'Cancelado' };
const statusColors = { not_started: 'bg-slate-100 text-slate-600', in_progress: 'bg-primary/10 text-primary', on_hold: 'bg-amber-50 text-amber-600', completed: 'bg-emerald-50 text-emerald-600', cancelled: 'bg-red-50 text-red-600' };
const clientStatusColors = { active: 'bg-emerald-50 text-emerald-600', inactive: 'bg-slate-100 text-slate-500', prospect: 'bg-amber-50 text-amber-600' };
const clientStatusLabels = { active: 'Ativo', inactive: 'Inativo', prospect: 'Prospect' };

export default function ClientDetail() {
  const { onMenuToggle } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [clientFiles, setClientFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setClientFiles(prev => [...prev, { name: file.name, url: file_url, type: file.type, size: file.size, uploaded_at: new Date().toISOString() }]);
    }
    toast.success('Arquivo(s) enviado(s)!');
    setUploading(false);
    e.target.value = '';
  };

  const getFileIcon = (type = '') => {
    if (type.startsWith('image/')) return { Icon: Image, color: 'text-green-600', bg: 'bg-green-50' };
    if (type.startsWith('video/')) return { Icon: Film, color: 'text-purple-600', bg: 'bg-purple-50' };
    if (type.includes('pdf')) return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
    if (type.includes('sheet') || type.includes('excel')) return { Icon: FileSpreadsheet, color: 'text-green-700', bg: 'bg-green-50' };
    return { Icon: File, color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const { data: clients = [] } = useQuery({
    queryKey: ['client', id],
    queryFn: () => base44.entities.Client.filter({ id }),
  });
  const client = clients[0];

  const { data: projects = [] } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: () => base44.entities.Project.filter({ client_id: id }, '-created_date', 50),
    enabled: !!id,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['client-tasks', id],
    queryFn: async () => {
      const clientProjectIds = projects.map(p => p.id);
      if (clientProjectIds.length === 0) return [];
      const allTasks = [];
      for (const pid of clientProjectIds) {
        const tasks = await base44.entities.Task.filter({ project_id: pid }, '-created_date', 100);
        allTasks.push(...tasks);
      }
      return allTasks;
    },
    enabled: projects.length > 0,
  });

  if (!client) {
    return (
      <>
        <TopBar onMenuToggle={onMenuToggle} title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const overdueTasks = allTasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
  );
  const doneTasks = allTasks.filter(t => t.status === 'done');

  const tabs = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'projects', label: `Projetos (${projects.length})` },
    { key: 'tasks', label: `Tarefas (${allTasks.length})` },
    { key: 'files', label: 'Arquivos' },
    { key: 'notes', label: 'Observações' },
  ];

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Clientes</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
          {/* Client Header */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-xl font-heading font-bold">{client.name}</h1>
                  <Badge variant="secondary" className={cn("text-xs", clientStatusColors[client.status])}>
                    {clientStatusLabels[client.status]}
                  </Badge>
                </div>
                {client.company && <p className="text-muted-foreground text-sm mb-2">{client.company}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {client.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</div>}
                  {client.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{client.phone}</div>}
                  {client.address && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{client.address}</div>}
                  {client.document && <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{client.document}</div>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 md:text-right shrink-0">
                <div>
                  <div className="text-2xl font-heading font-bold">{projects.length}</div>
                  <div className="text-xs text-muted-foreground">Projetos</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold text-emerald-600">{activeProjects.length}</div>
                  <div className="text-xs text-muted-foreground">Ativos</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold">{allTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Tarefas</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold text-red-500">{overdueTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Atrasadas</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick stats */}
              <Card className="p-5 space-y-4">
                <h3 className="font-heading font-semibold text-sm">Indicadores</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tarefas concluídas</span>
                    <span className="font-semibold">{doneTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" /> Tarefas atrasadas</span>
                    <span className="font-semibold">{overdueTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><FolderKanban className="w-4 h-4 text-primary" /> Projetos ativos</span>
                    <span className="font-semibold">{activeProjects.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Projetos concluídos</span>
                    <span className="font-semibold">{completedProjects.length}</span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {client.notes && (
                <Card className="p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </Card>
              )}
            </div>
          )}

          {/* Projects */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length === 0 ? (
                <Card className="p-12 text-center col-span-2">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum projeto vinculado</p>
                </Card>
              ) : (
                projects.map(p => (
                  <Link key={p.id} to={`/projects/${p.id}`}>
                    <Card className="p-5 hover:shadow-md transition-all hover:border-primary/20 cursor-pointer">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                        <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                      </div>
                      <Progress value={p.progress || 0} className="h-1.5 mb-2" />
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={cn("text-xs", statusColors[p.status])}>
                          {statusLabels[p.status]}
                        </Badge>
                        {p.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(p.due_date), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                {uploading ? <Loader2 className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />}
                <p className="text-sm text-muted-foreground">{uploading ? 'Enviando...' : 'Clique ou arraste arquivos para enviar'}</p>
              </label>
              {clientFiles.length === 0 ? (
                <Card className="p-10 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {clientFiles.map((f, i) => {
                    const { Icon: FIcon, color, bg } = getFileIcon(f.type);
                    return (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2 mx-auto", bg)}>
                            <FIcon className={cn("w-5 h-5", color)} />
                          </div>
                          <p className="text-xs font-medium text-center truncate">{f.name}</p>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {activeTab === 'notes' && (
            <Card className="p-5">
              {client.notes ? (
                <>
                  <h3 className="font-heading font-semibold text-sm mb-3">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada para este cliente.</p>
                  <p className="text-xs text-muted-foreground mt-1">Edite o cliente para adicionar observações.</p>
                </div>
              )}
            </Card>
          )}

          {/* Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {allTasks.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
                </Card>
              ) : (
                allTasks.map(task => {
                  const proj = projects.find(p => p.id === task.project_id);
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done';
                  return (
                    <Card key={task.id} className="p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium truncate", task.status === 'done' && "line-through text-muted-foreground")}>{task.title}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {proj && <span className="text-xs text-muted-foreground">{proj.name}</span>}
                            {task.due_date && (
                              <span className={cn("text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                                {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{task.status}</Badge>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}