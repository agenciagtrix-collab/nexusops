import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, QrCode } from 'lucide-react';
import QRCode from 'qrcode.react';

export default function ShareFormDialog({ form, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shareUrl = `${window.location.origin}/form/${form.id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="800" frameborder="0"></iframe>`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Public Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link Público</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="text-sm" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(shareUrl)}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Compartilhe este link para que pessoas respondam o formulário
          </p>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {showQR ? (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <QRCode value={shareUrl} size={200} />
            </div>
          ) : (
            <Button
              onClick={() => setShowQR(true)}
              variant="outline"
              className="w-full gap-2"
            >
              <QrCode className="w-4 h-4" />
              Gerar QR Code
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incorporar em Website</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={embedCode}
            readOnly
            className="w-full p-2 text-xs bg-muted rounded border font-mono"
            rows={3}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(embedCode)}
            className="w-full gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copiar Código
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}