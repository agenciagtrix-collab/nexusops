import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, QrCode, Code } from 'lucide-react';
import { toast } from 'sonner';
import FlowIntegrationPanel from './FlowIntegrationPanel';

export default function FlowPublishDialog({ open, onOpenChange, flow, onSuccess }) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(flow?.name?.toLowerCase().replace(/\s+/g, '-') || '');
  const [publicLink, setPublicLink] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const publishFlow = useMutation({
    mutationFn: async () => {
      const slug_token = Math.random().toString(36).substring(2, 15);
      const link_token = Math.random().toString(36).substring(2, 15) + Date.now();
      
      const publish = await base44.entities.FlowPublish.create({
        flow_id: flow.id,
        slug: slug || flow.id,
        link_token,
        is_public: true,
      });

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/flow/${publish.id}`;
      
      setPublicLink(url);
      
      return publish;
    },
    onSuccess: (data) => {
      base44.entities.Flow.update(flow.id, { ...flow, status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      toast.success('Fluxo publicado com sucesso!');
      onSuccess();
    },
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publicar Fluxo</DialogTitle>
          <DialogDescription>
            Configure as opções de publicação e compartilhamento do seu fluxo.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="integration" disabled={!publicLink}>Integrações</TabsTrigger>
            <TabsTrigger value="share" disabled={!publicLink}>Compartilhar</TabsTrigger>
            <TabsTrigger value="embed" disabled={!publicLink}>Incorporar</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <div className="space-y-2">
              <Label>Slug da URL</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="meu-fluxo"
                disabled={publishFlow.isPending}
              />
              <p className="text-xs text-muted-foreground">
                URL: {window.location.origin}/flow/{slug || flow?.id}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                Fluxo público
              </Label>
              <p className="text-xs text-muted-foreground">
                Qualquer pessoa com o link poderá acessar este fluxo
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => publishFlow.mutate()}
                disabled={publishFlow.isPending}
                className="flex-1"
              >
                {publishFlow.isPending ? 'Publicando...' : 'Publicar Fluxo'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          {publicLink && (
            <TabsContent value="integration" className="space-y-4">
              <FlowIntegrationPanel
                publish={{ integrations: {} }}
                onUpdate={(data) => {
                  toast.success('Integrações configuradas');
                }}
              />
            </TabsContent>
          )}

          {/* Share Tab */}
          {publicLink && (
            <TabsContent value="share" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Link do Fluxo</Label>
                  <div className="flex gap-2">
                    <Input
                      value={publicLink}
                      readOnly
                      className="flex-1 bg-muted"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(publicLink)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Compartilhar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = `Responda nosso fluxo: ${publicLink}`;
                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = `Responda nosso fluxo: ${publicLink}`;
                        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = `Responda nosso fluxo: ${publicLink}`;
                        const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(publicLink)}&text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `mailto:?subject=Responda nosso fluxo&body=${encodeURIComponent(publicLink)}`;
                        window.location.href = url;
                      }}
                    >
                      Email
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Embed Tab */}
          {publicLink && (
            <TabsContent value="embed" className="space-y-4">
              <div className="space-y-2">
                <Label>Código de Incorporação</Label>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{`<iframe src="${publicLink}" width="100%" height="600" frameborder="0"></iframe>`}</pre>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(`<iframe src="${publicLink}" width="100%" height="600" frameborder="0"></iframe>`)}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copiar Código
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}