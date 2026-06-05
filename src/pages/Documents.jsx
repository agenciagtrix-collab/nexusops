import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Image, Film, FileSpreadsheet, File, Upload, ExternalLink,
  Search, FolderOpen, Loader2, Grid, List as ListIcon, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getFileIcon(type = '') {
  if (type.startsWith('image/')) return { Icon: Image, color: 'text-green-600', bg: 'bg-green-50' };
  if (type.startsWith('video/')) return { Icon: Film, color: 'text-purple-600', bg: 'bg-purple-50' };
  if (type.includes('pdf')) return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv'))
    return { Icon: FileSpreadsheet, color: 'text-green-700', bg: 'bg-green-50' };
  return { Icon: File, color: 'text-blue-600', bg: 'bg-blue-50' };
}

function formatBytes(bytes = 0) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterContext, setFilterContext] = useState('all');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Arquivo removido.');
    },
  });

  const filtered = documents.filter(f => {
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    const matchContext = filterContext === 'all' || f.context === filterContext;
    return matchSearch && matchContext;
  });

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        name: file.name,
        url: file_url,
        type: file.type,
        size: file.size,
        context: 'document',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success('Arquivo(s) enviado(s) com sucesso!');
    setUploading(false);
    e.target.value = '';
  };

  const getProjectName = (doc) => {
    if (!doc.project_id) return null;
    return projects.find(p => p.id === doc.project_id)?.name;
  };

  const contextLabels = {
    document: 'Documento',
    project: 'Projeto',
    task: 'Tarefa',
    client: 'Cliente',
    comment: 'Comentário',
  };

  const imageCount = documents.filter(f => f.type?.startsWith('image/')).length;
  const pdfCount = documents.filter(f => f.type?.includes('pdf')).length;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Documentos"
        actions={
          <label>
            <input type="file" className="hidden" multiple onChange={handleUpload} />
            <Button asChild size="sm" className="gap-1.5" disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="hidden sm:inline">{uploading ? 'Enviando...' : 'Enviar'}</span>
              </span>
            </Button>
          </label>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total de Arquivos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{imageCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Imagens</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{pdfCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">PDFs</div>
            </Card>
          </div>

          {/* Upload drop zone */}
          <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <input type="file" className="hidden" multiple onChange={handleUpload} />
            {uploading
              ? <Loader2 className="w-8 h-8 text-primary/60 mx-auto mb-2 animate-spin" />
              : <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />}
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, imagens, vídeos, planilhas e documentos</p>
          </label>

          {/* Search + View toggle + filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar arquivos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterContext} onValueChange={setFilterContext}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="project">Projetos</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                className={cn("p-2 transition-colors", viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={cn("p-2 transition-colors", viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Files */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-16 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Nenhum arquivo encontrado para esta busca.' : 'Nenhum arquivo enviado ainda.'}
              </p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((file) => {
                const { Icon: FileIcon, color, bg } = getFileIcon(file.type);
                const projName = getProjectName(file);
                return (
                  <Card key={file.id} className="p-4 hover:shadow-md transition-shadow group relative">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto", bg)}>
                        <FileIcon className={cn("w-6 h-6", color)} />
                      </div>
                      <p className="text-xs font-medium text-center truncate">{file.name}</p>
                      {file.context && (
                        <p className="text-xs text-muted-foreground text-center mt-0.5">{contextLabels[file.context] || file.context}</p>
                      )}
                      {projName && (
                        <p className="text-xs text-primary text-center mt-0.5 truncate">{projName}</p>
                      )}
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Arquivo</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Projeto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Tamanho</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Data</th>
                      <th className="w-16 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((file) => {
                      const { Icon: RowIcon, color, bg } = getFileIcon(file.type);
                      const projName = getProjectName(file);
                      return (
                        <tr key={file.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
                                <RowIcon className={cn("w-4 h-4", color)} />
                              </div>
                              <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{contextLabels[file.context] || '—'}</td>
                          <td className="p-3 text-xs text-primary">{projName || '—'}</td>
                          <td className="p-3 text-xs text-muted-foreground">{formatBytes(file.size)}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {file.created_date ? format(new Date(file.created_date), "dd/MM/yy", { locale: ptBR }) : '—'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </a>
                              <button onClick={() => deleteMutation.mutate(file.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}