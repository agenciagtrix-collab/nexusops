import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ExportPDFButton({ projectId = null, label = 'Exportar PDF', variant = 'outline', size = 'sm' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (opts = {}) => {
    setLoading(true);
    try {
      // base44.functions.invoke returns axios response; for binary we need raw fetch via the SDK's internal axios
      const res = await base44.functions.invoke('exportProjectPDF', {
        project_id: projectId || undefined,
        include_tasks: opts.includeTasks ?? true,
        include_stats: opts.includeStats ?? true,
      }, { responseType: 'arraybuffer' });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${projectId ? 'projeto' : 'geral'}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar: ' + (err.message || 'tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className="gap-1.5">
        <Loader2 className="w-4 h-4 animate-spin" />
        Gerando...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <FileDown className="w-4 h-4" />
          {label}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport({ includeTasks: true, includeStats: true })}>
          Relatório Completo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport({ includeTasks: false, includeStats: true })}>
          Só Projetos (sem tarefas)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport({ includeTasks: true, includeStats: false })}>
          Só Tarefas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}