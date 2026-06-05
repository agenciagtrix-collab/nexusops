import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Image, Film, FileSpreadsheet, File, Upload, ExternalLink,
  Search, FolderOpen, Loader2, Grid, List as ListIcon
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
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  // Collect all task attachments
  const taskFiles = [];
  tasks.forEach(task => {
    const project = projects.find(p => p.id === task.project_id);
    (task.attachments || []).forEach(att => {
      taskFiles.push({ ...att, source: task.title, project: project?.name, context: 'tarefa' });
    });
  });

  const allFiles = [...uploadedFiles, ...taskFiles];
  const filtered = allFiles.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFiles(prev => [{
        name: file.name,
        url: file_url,
        type: file.type,
        size: file.size,
        source: 'Upload direto',
        context: 'documento',
        uploaded_at: new Date().toISOString(),
      }, ...prev]);
    }
    toast.success('Arquivo(s) enviado(s) com sucesso!');
    setUploading(false);
    e.target.value = '';
  };

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
              <div className="text-2xl font-bold">{allFiles.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total de Arquivos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{allFiles.filter(f => f.type?.startsWith('image/')).length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Imagens</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{uploadedFiles.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Documentos</div>
            </Card>
          </div>

          {/* Search + View toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
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

          {/* Upload drop zone */}
          <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <input type="file" className="hidden" multiple onChange={handleUpload} />
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, imagens, vídeos, planilhas e documentos</p>
          </label>

          {/* Files */}
          {filtered.length === 0 ? (
            <Card className="p-16 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado.</p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((file, idx) => {
                const { Icon: FileIcon, color, bg } = getFileIcon(file.type);
                    return (
                      <Card key={idx} className="p-4 hover:shadow-md transition-shadow group cursor-pointer">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto", bg)}>
                            <FileIcon className={cn("w-6 h-6", color)} />
                      </div>
                      <p className="text-xs font-medium text-center truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground text-center mt-1 truncate">{file.source}</p>
                      {file.project && (
                        <p className="text-xs text-primary text-center mt-0.5 truncate">{file.project}</p>
                      )}
                    </a>
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
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Origem</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Projeto</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Tamanho</th>
                      <th className="w-10 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((file, idx) => {
                      const { Icon: RowFileIcon, color: rowColor, bg: rowBg } = getFileIcon(file.type);
                      return (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", rowBg)}>
                            <RowFileIcon className={cn("w-4 h-4", rowColor)} />
                              </div>
                              <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{file.source}</td>
                          <td className="p-3 text-xs text-primary">{file.project || '—'}</td>
                          <td className="p-3 text-xs text-muted-foreground">{formatBytes(file.size)}</td>
                          <td className="p-3">
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </a>
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