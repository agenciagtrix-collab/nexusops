import React from 'react';
import { Card } from '@/components/ui/card';
import { Megaphone, MessageSquare } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PortalUpdates({ updates }) {
  if (updates.length === 0) {
    return (
      <Card className="p-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-foreground">Nenhuma atualização publicada ainda</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
          A equipe publicará comunicados sobre o andamento do projeto em breve.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Atualizações do Projeto</h3>
        <span className="text-xs text-muted-foreground">{updates.length} publicação(ões)</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />

        <div className="space-y-4">
          {updates.map((upd, i) => (
            <div key={upd.id} className="flex gap-4">
              {/* Dot */}
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 ring-4 ring-background
                ${i === 0 ? 'bg-primary' : 'bg-muted border border-border'}`}>
                <MessageSquare className={`w-4 h-4 ${i === 0 ? 'text-white' : 'text-muted-foreground'}`} />
              </div>

              {/* Card */}
              <Card className={`flex-1 p-5 ${i === 0 ? 'border-primary/30 bg-primary/5' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-sm text-foreground leading-snug">{upd.title}</h4>
                  <div className="text-right flex-shrink-0">
                    <time className="text-xs text-muted-foreground block">
                      {format(parseISO(upd.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </time>
                    <time className="text-[10px] text-muted-foreground/70 block">
                      {formatDistanceToNow(parseISO(upd.created_date), { addSuffix: true, locale: ptBR })}
                    </time>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{upd.content}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}