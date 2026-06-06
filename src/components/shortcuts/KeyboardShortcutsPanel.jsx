import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

function KeyBadge({ keyStr }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-mono font-semibold bg-muted border border-border rounded shadow-sm">
      {keyStr === 'Escape' ? 'Esc' : keyStr}
    </kbd>
  );
}

const categories = [...new Set(SHORTCUTS.map(s => s.category))];

export default function KeyboardShortcutsPanel({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {categories.map(category => (
            <div key={category}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {category}
              </p>
              <div className="space-y-1.5">
                {SHORTCUTS.filter(s => s.category === category).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          <KeyBadge keyStr={k} />
                          {ki < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">then</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Dica:</span> Atalhos com duas teclas (ex: <KeyBadge keyStr="g" /> <KeyBadge keyStr="h" />) — pressione a primeira tecla, depois a segunda em até 1 segundo. Atalhos não funcionam quando um campo de texto está focado.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}