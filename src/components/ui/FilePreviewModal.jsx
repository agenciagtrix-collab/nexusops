import React from 'react';
import { X, Download, ExternalLink, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;

  const type = file.type || '';
  const isImage = type.startsWith('image/');
  const isVideo = type.startsWith('video/');
  const isPdf = type.includes('pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-t-xl px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={file.url}
              download={file.name}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Baixar"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-b-xl overflow-hidden flex items-center justify-center" style={{ maxHeight: 'calc(90vh - 60px)' }}>
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: 'calc(90vh - 60px)' }}
            />
          ) : isVideo ? (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: 'calc(90vh - 60px)' }}
            >
              Seu navegador não suporta vídeo.
            </video>
          ) : isPdf ? (
            <iframe
              src={file.url}
              className="w-full"
              style={{ height: 'calc(90vh - 60px)' }}
              title={file.name}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-16 text-center">
              <File className="w-16 h-16 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Pré-visualização não disponível para este tipo de arquivo.</p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Abrir arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}