import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Paperclip, FileText, Image, Film, FileSpreadsheet, File, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FilePreviewModal from '@/components/ui/FilePreviewModal';

function getFileIcon(type = '') {
  if (type.startsWith('image/')) return { Icon: Image, color: 'text-green-600', bg: 'bg-green-50' };
  if (type.startsWith('video/')) return { Icon: Film, color: 'text-purple-600', bg: 'bg-purple-50' };
  if (type.includes('pdf')) return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv'))
    return { Icon: FileSpreadsheet, color: 'text-green-700', bg: 'bg-green-50' };
  return { Icon: File, color: 'text-blue-600', bg: 'bg-blue-50' };
}

export default function TaskAttachments({ attachments = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newAttachments = [...attachments];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newAttachments.push({ name: file.name, url: file_url, type: file.type });
    }
    onChange(newAttachments);
    toast.success('Arquivo(s) anexado(s)!');
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Paperclip className="w-4 h-4" /> Anexos ({attachments.length})
        </span>
        <label>
          <input type="file" multiple className="hidden" onChange={handleUpload} />
          <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Enviando...' : 'Anexar'}
            </span>
          </Button>
        </label>
      </div>

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((att, i) => {
            const { Icon, color, bg } = getFileIcon(att.type);
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <span className="text-sm flex-1 truncate">{att.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewFile(att)}>
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAttachment(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <input type="file" multiple className="hidden" onChange={handleUpload} />
          <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Clique ou arraste arquivos aqui</p>
        </label>
      )}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}