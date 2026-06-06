import React from 'react';
import { Card } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PortalUpdates({ updates }) {
  if (updates.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-muted-foreground">Nenhuma atualização publicada ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">A equipe publicará atualizações em breve.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((upd) => (
        <Card key={upd.id} className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="font-semibold text-sm">{upd.title}</h4>
                <time className="text-xs text-muted-foreground shrink-0">
                  {format(parseISO(upd.created_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </time>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{upd.content}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}