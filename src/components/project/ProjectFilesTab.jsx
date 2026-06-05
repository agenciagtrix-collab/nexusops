import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FilePreviewModal from '@/components/ui/FilePreviewModal';
import { FileText, Image, Film, FileSpreadsheet, File, Upload, ExternalLink, Loader2, Trash2, Eye } from 'lucide-react';
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

export default function ProjectFilesTab({ project, tasks = [] }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const { data: projectDocs = [] } = useQuery({
    queryKey: ['project-documents', project?.id],
    queryFn: () => base44.entities.Document.filter({ project_id: project?.id }, '-created_date', 100),
    enabled: !!project?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', project?.id] });
      toast.success('Arquivo removido.');
    },
  });

  // Task attachments (inline, not in DB as Document)
  const taskFiles = tasks.flatMap(task =>
    (task.attachments || []).map(att => ({ ...att, source: `Tarefa: ${task.title}`, fromTask: true }))
  );

  const allFiles = [
    ...projectDocs.map(d => ({ ...d, source: 'Central de Arquivos' })),
    ...taskFiles,
  ];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        name: file.name, url: file_url, type: file.type,
        size: file.size, project_id: project.id, context: 'project',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['project-documents', project?.id] });
    toast.success('Arquivo(s) enviado(s)!');
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Central de Arquivos</h3>
            <p className="text-xs text-muted-foreground">{allFiles.length} arquivo(s)</p>
          </div>
          <label>
            <input type="file" className="hidden" multiple onChange={handleUpload} />
            <Button asChild size="sm" className="gap-1.5" disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Enviando...' : 'Enviar Arquivo'}
              </span>
            </Button>
          </label>
        </div>
        <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <input type="file" className="hidden" multiple onChange={handleUpload} />
          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou <span className="text-primary">clique para selecionar</span></p>
          <p className="text-xs text-muted-foreground mt-1">PDF, imagens, vídeos, planilhas e documentos</p>
        </label>
      </Card>

      {/* Files grid */}
      {allFiles.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum arquivo no projeto ainda.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allFiles.map((file, idx) => {
            const { Icon: FIcon, color, bg } = getFileIcon(file.type);
            return (
              <Card key={file.id || idx} className="p-4 hover:shadow-md transition-shadow group relative">
                <div className="flex items-start gap-3">
                  <button
                    className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-opacity", bg)}
                    onClick={() => setPreview(file)}
                    title="Pré-visualizar"
                  >
                    <FIcon className={cn("w-5 h-5", color)} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{file.source}</p>
                    {file.size && <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>}
                    {file.created_date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(file.created_date), "dd/MM/yy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPreview(file)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Pré-visualizar"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a href={file.url} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {!file.fromTask && file.id && (
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}