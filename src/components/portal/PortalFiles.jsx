import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Image, FileSpreadsheet, Film, File } from 'lucide-react';

function getFileIcon(type) {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.startsWith('video/')) return Film;
  return FileText;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalFiles({ documents }) {
  if (documents.length === 0) {
    return (
      <Card className="p-10 text-center">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum arquivo compartilhado.</p>
        <p className="text-xs text-muted-foreground mt-1">Arquivos disponibilizados pela equipe aparecerão aqui.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.type);
        return (
          <Card key={doc.id} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              {(doc.description || doc.size) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {doc.description || formatSize(doc.size)}
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.name}>
                <Download className="w-3.5 h-3.5" /> Baixar
              </a>
            </Button>
          </Card>
        );
      })}
    </div>
  );
}